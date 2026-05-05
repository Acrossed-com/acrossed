import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { encrypt, decryptString } from "../crypto/aes.js";
import { generateApiKey, generateSigningSecret, hashKey } from "../lib/keys.js";
import { requireUser } from "../middleware/clerkAuth.js";
import {
  registerNewProject,
  removeProject,
  getByProjectId,
  upsertRules,
  setProjectPlan,
} from "../engine/store.js";
import type { Ruleset } from "../engine/evaluator.js";
import { generateSlug, normalizeDomain } from "../lib/slug.js";
import { planFor, type PlanId } from "../lib/plans.js";

const FOUNDER_IDS = new Set(
  (process.env.ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);


const createSchema = z.object({ name: z.string().min(1).max(80) });

const MAX_RULE_JSON_BYTES = 256 * 1024;

const ruleSchema = z
  .object({
    id: z.string().max(120).optional(),
    priority: z.number().int().min(0).max(10_000).optional(),
    match: z
      .object({
        path: z.union([z.string(), z.array(z.string())]).optional(),
        method: z.union([z.string(), z.array(z.string())]).optional(),
      })
      .optional(),
    ip_block: z.array(z.string()).max(10_000).optional(),
    ip_allow: z.array(z.string()).max(10_000).optional(),
    country_block: z.array(z.string().length(2)).max(300).optional(),
    country_allow: z.array(z.string().length(2)).max(300).optional(),
    require_header: z.union([z.string(), z.array(z.string())]).optional(),
    forbid_header: z.union([z.string(), z.array(z.string())]).optional(),
    require_query: z.union([z.string(), z.array(z.string())]).optional(),
    time: z
      .object({
        after: z.string().optional(),
        before: z.string().optional(),
        days: z.array(z.number().int().min(0).max(6)).optional(),
      })
      .optional(),
    limit: z
      .object({
        requests: z.number().int().min(1).max(1_000_000),
        window: z.string(),
        by: z.enum(["ip", "header"]).optional(),
        header: z.string().optional(),
      })
      .optional(),
    action: z.enum(["allow", "deny"]).optional(),
    reason: z.string().max(120).optional(),
  })
  .strict();

const rulesSchema = z.object({ rules: z.array(ruleSchema) });

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", requireUser);

  // List my projects
  app.get("/projects", async (req) => {
    const rows = await db
      .select({
        id: schema.projects.id,
        name: schema.projects.name,
        slug: schema.projects.slug,
        plan: schema.projects.plan,
        createdAt: schema.projects.createdAt,
        updatedAt: schema.projects.updatedAt,
      })
      .from(schema.projects)
      .where(eq(schema.projects.ownerId, req.userId!));
    return {
      projects: rows.map((r) => ({
        ...r,
        defaultUrl: `https://${r.slug}.acrsd.dev`,
      })),
    };
  });

  // Create project
  app.post("/projects", async (req, reply) => {
    const body = createSchema.parse(req.body);
    const apiKey = generateApiKey();
    const signingSecret = generateSigningSecret();
    const apiKeyHash = hashKey(apiKey);
    const initialRules: Ruleset = [];

    // Slug uniqueness — try a few times before giving up.
    let slug = generateSlug(body.name);
    for (let i = 0; i < 5; i++) {
      const [exists] = await db
        .select({ id: schema.projects.id })
        .from(schema.projects)
        .where(eq(schema.projects.slug, slug));
      if (!exists) break;
      slug = generateSlug(body.name);
    }

    const founderPlan: PlanId = FOUNDER_IDS.has(req.userId!) ? "enterprise" : "free";
    const [row] = await db
      .insert(schema.projects)
      .values({
        ownerId: req.userId!,
        name: body.name,
        slug,
        plan: founderPlan,
        apiKeyHash,
        apiKeyEncrypted: encrypt(apiKey),
        signingSecretEncrypted: encrypt(signingSecret),
        encryptedRules: encrypt(JSON.stringify(initialRules)),
      })
      .returning();
    registerNewProject({
      projectId: row.id,
      apiKeyHash,
      signingSecret,
      rules: initialRules,
      plan: founderPlan,
      slug,
    });
    reply.code(201);
    return {
      id: row.id,
      name: row.name,
      slug,
      plan: founderPlan,
      defaultUrl: `https://${slug}.acrsd.dev`,
      apiKey,         // shown once
      signingSecret,  // shown once
    };
  });

  // Get a project's metadata + (decrypted) rules + custom domains
  app.get("/projects/:id", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const [row] = await db
      .select()
      .from(schema.projects)
      .where(and(eq(schema.projects.id, id), eq(schema.projects.ownerId, req.userId!)));
    if (!row) return reply.code(404).send({ error: "not_found" });
    const domains = await db
      .select()
      .from(schema.customDomains)
      .where(eq(schema.customDomains.projectId, id));
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      plan: row.plan,
      defaultUrl: `https://${row.slug}.acrsd.dev`,
      planDetails: planFor(row.plan),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      rules: JSON.parse(decryptString(row.encryptedRules)),
      customDomains: domains,
    };
  });

  // Replace rules — enforces the plan's maxRules cap.
  app.put("/projects/:id/rules", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const [row] = await db
      .select({ id: schema.projects.id, plan: schema.projects.plan })
      .from(schema.projects)
      .where(and(eq(schema.projects.id, id), eq(schema.projects.ownerId, req.userId!)));
    if (!row) return reply.code(404).send({ error: "not_found" });
    let body: z.infer<typeof rulesSchema>;
    try {
      body = rulesSchema.parse(req.body);
    } catch (e) {
      return reply.code(400).send({
        error: "invalid_rules",
        details: (e as z.ZodError).issues ?? String(e),
      });
    }
    const plan = planFor(row.plan);
    if (body.rules.length > plan.maxRules) {
      return reply.code(402).send({
        error: "rule_limit_exceeded",
        plan: plan.id,
        maxRules: plan.maxRules,
        upgradeUrl: "/dashboard/billing",
      });
    }
    const json = JSON.stringify(body.rules);
    if (Buffer.byteLength(json, "utf8") > MAX_RULE_JSON_BYTES) {
      return reply.code(413).send({ error: "ruleset_too_large", limit: MAX_RULE_JSON_BYTES });
    }
    await upsertRules(id, body.rules as Ruleset);
    return { ok: true, count: body.rules.length };
  });

  app.post("/projects/:id/rotate", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const [row] = await db
      .select()
      .from(schema.projects)
      .where(and(eq(schema.projects.id, id), eq(schema.projects.ownerId, req.userId!)));
    if (!row) return reply.code(404).send({ error: "not_found" });

    const apiKey = generateApiKey();
    const signingSecret = generateSigningSecret();
    const apiKeyHash = hashKey(apiKey);
    await db
      .update(schema.projects)
      .set({
        apiKeyHash,
        apiKeyEncrypted: encrypt(apiKey),
        signingSecretEncrypted: encrypt(signingSecret),
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, id));

    const existing = getByProjectId(id);
    const rulesSnapshot = existing?.rules ?? JSON.parse(decryptString(row.encryptedRules));
    removeProject(id);
    registerNewProject({
      projectId: id,
      apiKeyHash,
      signingSecret,
      rules: rulesSnapshot,
      plan: row.plan as PlanId,
      slug: row.slug,
    });
    return { apiKey, signingSecret };
  });

  app.delete("/projects/:id", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const res = await db
      .delete(schema.projects)
      .where(and(eq(schema.projects.id, id), eq(schema.projects.ownerId, req.userId!)))
      .returning({ id: schema.projects.id });
    if (res.length === 0) return reply.code(404).send({ error: "not_found" });
    removeProject(id);
    return { ok: true };
  });

  // Usage stats including the monthly quota counter from in-memory state.
  app.get("/projects/:id/usage", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const [row] = await db
      .select({ id: schema.projects.id, plan: schema.projects.plan })
      .from(schema.projects)
      .where(and(eq(schema.projects.id, id), eq(schema.projects.ownerId, req.userId!)));
    if (!row) return reply.code(404).send({ error: "not_found" });
    const [u] = await db
      .select()
      .from(schema.usage)
      .where(eq(schema.usage.projectId, id));
    const live = getByProjectId(id);
    const plan = planFor(row.plan);
    return {
      projectId: id,
      plan: plan.id,
      monthlyChecks: live?.quota.used ?? 0,
      monthlyCap: plan.monthlyChecks,
      monthlyResetAt: live?.quota.resetAt ?? null,
      requestCount: u?.requestCount ?? 0,
      allowedCount: u?.allowedCount ?? 0,
      deniedCount: u?.deniedCount ?? 0,
    };
  });

  // ─── Custom domains ────────────────────────────────────────────────────────
  // POST /projects/:id/domains  body: { domain }
  app.post("/projects/:id/domains", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = z.object({ domain: z.string().min(4).max(253) }).safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_body" });
    const domain = normalizeDomain(body.data.domain);
    if (!domain) return reply.code(400).send({ error: "invalid_domain" });

    const [proj] = await db
      .select({ id: schema.projects.id, plan: schema.projects.plan })
      .from(schema.projects)
      .where(and(eq(schema.projects.id, id), eq(schema.projects.ownerId, req.userId!)));
    if (!proj) return reply.code(404).send({ error: "not_found" });

    const plan = planFor(proj.plan);
    if (plan.maxCustomDomains < 1) {
      return reply.code(402).send({
        error: "custom_domains_not_in_plan",
        plan: plan.id,
        upgradeUrl: "/dashboard/billing",
      });
    }
    const existing = await db
      .select()
      .from(schema.customDomains)
      .where(eq(schema.customDomains.projectId, id));
    if (existing.length >= plan.maxCustomDomains) {
      return reply.code(402).send({
        error: "custom_domain_limit_exceeded",
        plan: plan.id,
        max: plan.maxCustomDomains,
      });
    }
    // Reserve — fails if another project already claimed it.
    try {
      await db.insert(schema.customDomains).values({ domain, projectId: id });
    } catch {
      return reply.code(409).send({ error: "domain_already_claimed" });
    }
    return {
      ok: true,
      domain,
      instructions: {
        type: "CNAME",
        name: domain,
        value: "edge.acrsd.dev",
        note:
          "Add a CNAME from your DNS provider pointing to edge.acrsd.dev. " +
          "On the first HTTPS hit our edge will mint a TLS cert via on-demand TLS — usually under 5 seconds.",
      },
    };
  });

  app.delete("/projects/:id/domains/:domain", async (req, reply) => {
    const { id, domain } = req.params as { id: string; domain: string };
    const norm = normalizeDomain(domain);
    if (!norm) return reply.code(400).send({ error: "invalid_domain" });
    const [proj] = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(and(eq(schema.projects.id, id), eq(schema.projects.ownerId, req.userId!)));
    if (!proj) return reply.code(404).send({ error: "not_found" });
    await db
      .delete(schema.customDomains)
      .where(and(eq(schema.customDomains.projectId, id), eq(schema.customDomains.domain, norm)));
    return { ok: true };
  });

  // POST /projects/:id/plan  body: { plan }  — admin/manual upgrade hook.
  // Polar webhook (routes/webhooks.ts) is the production path; this exists for
  // self-service downgrades and for the dashboard's "preview tier" UX.
  app.post("/projects/:id/plan", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = z
      .object({ plan: z.enum(["free", "pro", "enterprise"]) })
      .safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_plan" });
    const [row] = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(and(eq(schema.projects.id, id), eq(schema.projects.ownerId, req.userId!)));
    if (!row) return reply.code(404).send({ error: "not_found" });
    await db
      .update(schema.projects)
      .set({ plan: body.data.plan, updatedAt: new Date() })
      .where(eq(schema.projects.id, id));
    setProjectPlan(id, body.data.plan);
    return { ok: true, plan: body.data.plan };
  });
}
