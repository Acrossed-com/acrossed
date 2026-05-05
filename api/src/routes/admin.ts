// Admin routes — restricted to a hardcoded list of Clerk user IDs supplied
// via the ADMIN_CLERK_USER_IDS env var (comma-separated). The web dashboard
// proxies these endpoints over the internal-secret channel after verifying
// the caller's Clerk user ID is in the list. We re-verify on the server.

import type { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { type PlanId, PLANS, planFor } from "../lib/plans.js";
import { setProjectPlan } from "../engine/store.js";
import { config } from "../config.js";

const adminIds = new Set(
  (process.env.ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

function requireInternalSecret(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const got = req.headers["x-internal-secret"];
  return typeof got === "string" && got === config.INTERNAL_SECRET;
}

function requireAdmin(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const uid = req.headers["x-acting-clerk-user-id"];
  return typeof uid === "string" && adminIds.has(uid);
}

async function execOne<T>(query: ReturnType<typeof sql>): Promise<T | undefined> {
  const result = await db.execute(query);
  const rows = ((result as unknown as { rows?: T[] }).rows ?? result) as T[];
  return rows[0];
}

async function execAll<T>(query: ReturnType<typeof sql>): Promise<T[]> {
  const result = await db.execute(query);
  return ((result as unknown as { rows?: T[] }).rows ?? result) as T[];
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // Aggregate platform stats — total projects, decisions today/this month,
  // allow/deny ratio. Cheap aggregation queries — fine to call from a polling
  // dashboard.
  app.get("/admin/stats", async (req, reply) => {
    if (!requireInternalSecret(req) || !requireAdmin(req)) return reply.code(403).send({ error: "forbidden" });

    const projectsRow = await execOne<{ count: string }>(sql`SELECT COUNT(*)::text AS count FROM projects`);
    const usageAgg = await execOne<{
      total_requests: string | null;
      total_allowed: string | null;
      total_denied: string | null;
      monthly_total: string | null;
    }>(sql`
      SELECT
        COALESCE(SUM(request_count), 0)::text AS total_requests,
        COALESCE(SUM(allowed_count), 0)::text AS total_allowed,
        COALESCE(SUM(denied_count),  0)::text AS total_denied,
        COALESCE(SUM(monthly_checks),0)::text AS monthly_total
      FROM usage
    `);
    const planBreakdown = await execOne<{
      free: string;
      pro: string;
      enterprise: string;
    }>(sql`
      SELECT
        COUNT(*) FILTER (WHERE plan = 'free')::text       AS free,
        COUNT(*) FILTER (WHERE plan = 'pro')::text        AS pro,
        COUNT(*) FILTER (WHERE plan = 'enterprise')::text AS enterprise
      FROM projects
    `);
    const domains = await execOne<{ count: string }>(sql`SELECT COUNT(*)::text AS count FROM custom_domains`);

    return {
      projects: Number(projectsRow?.count ?? 0),
      customDomains: Number(domains?.count ?? 0),
      planBreakdown: {
        free: Number(planBreakdown?.free ?? 0),
        pro: Number(planBreakdown?.pro ?? 0),
        enterprise: Number(planBreakdown?.enterprise ?? 0),
      },
      usage: {
        totalRequests: Number(usageAgg?.total_requests ?? 0),
        totalAllowed: Number(usageAgg?.total_allowed ?? 0),
        totalDenied: Number(usageAgg?.total_denied ?? 0),
        monthlyTotal: Number(usageAgg?.monthly_total ?? 0),
      },
      planCaps: Object.fromEntries(
        Object.entries(PLANS).map(([k, v]) => [k, { monthlyChecks: v.monthlyChecks, maxRules: v.maxRules }]),
      ),
    };
  });

  // List every project with summary fields. Used to render an admin table.
  app.get("/admin/projects", async (req, reply) => {
    if (!requireInternalSecret(req) || !requireAdmin(req)) return reply.code(403).send({ error: "forbidden" });

    const rows = await execAll<{
      id: string;
      owner_id: string;
      name: string;
      slug: string;
      plan: string;
      created_at: string;
      monthly_checks: string | null;
      request_count: string | null;
      denied_count: string | null;
    }>(sql`
      SELECT
        p.id::text       AS id,
        p.owner_id       AS owner_id,
        p.name           AS name,
        p.slug           AS slug,
        p.plan           AS plan,
        p.created_at::text AS created_at,
        u.monthly_checks::text AS monthly_checks,
        u.request_count::text  AS request_count,
        u.denied_count::text   AS denied_count
      FROM projects p
      LEFT JOIN usage u ON u.project_id = p.id
      ORDER BY p.created_at DESC
      LIMIT 500
    `);

    return {
      projects: rows.map((r) => ({
        id: r.id,
        ownerId: r.owner_id,
        name: r.name,
        slug: r.slug,
        plan: r.plan,
        createdAt: r.created_at,
        monthlyChecks: Number(r.monthly_checks ?? 0),
        totalRequests: Number(r.request_count ?? 0),
        totalDenied: Number(r.denied_count ?? 0),
        cap: planFor(r.plan).monthlyChecks,
      })),
    };
  });

  // Manually override a project's plan (e.g. to comp a customer or rescue an
  // upgrade that didn't sync from Polar).
  app.post<{ Params: { id: string }; Body: { plan: PlanId } }>("/admin/projects/:id/plan", async (req, reply) => {
    if (!requireInternalSecret(req) || !requireAdmin(req)) return reply.code(403).send({ error: "forbidden" });
    const { plan } = req.body ?? {};
    if (plan !== "free" && plan !== "pro" && plan !== "enterprise") {
      return reply.code(400).send({ error: "invalid_plan" });
    }
    await db.update(schema.projects).set({ plan, updatedAt: new Date() }).where(eq(schema.projects.id, req.params.id));
    setProjectPlan(req.params.id, plan);
    return { ok: true, plan };
  });
}
