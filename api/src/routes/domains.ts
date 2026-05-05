// Domain resolver — used by Caddy's on-demand TLS hook to decide whether to
// mint a certificate for an arbitrary inbound hostname. Caddy is configured to
// hit `/domains/check?domain=<host>` before issuing; we return 200 if we know
// the host and 404 otherwise. This prevents random hostnames from triggering
// Let's Encrypt rate limits.
//
// The endpoint is unauthenticated (Caddy talks over loopback) but only returns
// a tiny boolean — no project metadata is leaked.
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { getProjectIdBySlug } from "../engine/store.js";

export async function domainRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { domain?: string } }>("/domains/check", async (req, reply) => {
    const domain = (req.query.domain ?? "").trim().toLowerCase();
    if (!domain) return reply.code(400).send("missing");

    // Wildcard subdomains under our own zones are always allowed; the slug is
    // verified against the in-memory map for O(1) check.
    if (domain.endsWith(".acrsd.dev")) {
      const slug = domain.slice(0, -".acrsd.dev".length);
      if (slug === "edge" || slug === "www") return reply.code(200).send("ok");
      return getProjectIdBySlug(slug)
        ? reply.code(200).send("ok")
        : reply.code(404).send("unknown_subdomain");
    }
    // Explicit allowlist for our own service hosts. Avoids issuing certs for
    // arbitrary acrossed.com subdomains (which would burn LE rate limits if
    // someone pointed a CNAME at us with a random label).
    const SERVICE_HOSTS = new Set([
      "acrossed.com",
      "www.acrossed.com",
      "api.acrossed.com",
      "clerk.acrossed.com",
      "app.acrossed.com",
      "edge.acrsd.dev",
      "acrsd.dev",
      "www.acrsd.dev",
    ]);
    if (SERVICE_HOSTS.has(domain)) return reply.code(200).send("ok");

    // Custom domains attached by users.
    const [row] = await db
      .select({ projectId: schema.customDomains.projectId })
      .from(schema.customDomains)
      .where(eq(schema.customDomains.domain, domain));
    return row ? reply.code(200).send("ok") : reply.code(404).send("not_attached");
  });

  // Public lookup that returns project meta from a known host. Used by the web
  // app's catch-all to render the "protected by" page on default subdomains.
  app.get<{ Querystring: { domain?: string } }>("/domains/resolve", async (req, reply) => {
    const domain = (req.query.domain ?? "").trim().toLowerCase();
    if (!domain) return reply.code(400).send({ error: "missing_domain" });

    let projectId: string | null = null;
    if (domain.endsWith(".acrsd.dev")) {
      const slug = domain.slice(0, -".acrsd.dev".length);
      projectId = getProjectIdBySlug(slug) ?? null;
    } else {
      const [row] = await db
        .select({ projectId: schema.customDomains.projectId })
        .from(schema.customDomains)
        .where(eq(schema.customDomains.domain, domain));
      projectId = row?.projectId ?? null;
    }
    if (!projectId) return reply.code(404).send({ error: "not_found" });

    const [proj] = await db
      .select({
        id: schema.projects.id,
        name: schema.projects.name,
        slug: schema.projects.slug,
        plan: schema.projects.plan,
      })
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId));
    if (!proj) return reply.code(404).send({ error: "not_found" });
    return { ...proj, defaultUrl: `https://${proj.slug}.acrsd.dev` };
  });
}
