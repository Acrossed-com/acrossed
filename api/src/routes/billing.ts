// Billing routes — Polar checkout + portal links + plans listing.
//
// Checkout creates a Polar checkout session pre-bound to a project so the
// webhook (routes/webhooks.ts) can flip the plan on payment success. Portal
// returns a self-service URL where the customer can cancel / change card.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { requireUser } from "../middleware/clerkAuth.js";
import { PLANS, type PlanId } from "../lib/plans.js";
import { config } from "../config.js";

const POLAR_API = "https://api.polar.sh/v1";

interface PolarCheckout {
  id: string;
  url: string;
}

async function polarFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${POLAR_API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${config.POLAR_ACCESS_TOKEN}`,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`polar ${path} -> ${res.status} ${await res.text().catch(() => "")}`);
  }
  return (await res.json()) as T;
}

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  // Public — used by the landing page and dashboard pricing card.
  app.get("/billing/plans", async () => {
    return { plans: Object.values(PLANS) };
  });

  // All other billing endpoints require a signed-in Clerk user.
  app.register(async (scoped) => {
    scoped.addHook("preHandler", requireUser);

    // POST /billing/checkout  body: { projectId, plan }
    scoped.post("/billing/checkout", async (req, reply) => {
      const body = z
        .object({
          projectId: z.string().uuid(),
          plan: z.enum(["pro","scale","business"]),
        })
        .safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: "invalid_body" });

      const [proj] = await db
        .select({
          id: schema.projects.id,
          name: schema.projects.name,
          plan: schema.projects.plan,
        })
        .from(schema.projects)
        .where(
          and(eq(schema.projects.id, body.data.projectId), eq(schema.projects.ownerId, req.userId!))
        );
      if (!proj) return reply.code(404).send({ error: "project_not_found" });

      if (!config.POLAR_ACCESS_TOKEN) {
        return reply.code(503).send({
          error: "billing_not_configured",
          hint: "POLAR_ACCESS_TOKEN missing in API env",
        });
      }

      const targetPlan = PLANS[body.data.plan as PlanId];
      try {
        const checkout = await polarFetch<PolarCheckout>("/checkouts", {
          method: "POST",
          body: JSON.stringify({
            product_price_id: targetPlan.polarPriceId,
            success_url: `https://acrossed.com/dashboard/projects/${proj.id}?upgraded=1`,
            customer_email: undefined,
            metadata: {
              project_id: proj.id,
              user_id: req.userId,
              plan: targetPlan.id,
            },
          }),
        });
        return { url: checkout.url, id: checkout.id };
      } catch (e) {
        req.log.error({ err: e }, "polar checkout failed");
        return reply.code(502).send({ error: "billing_provider_error" });
      }
    });

    // POST /billing/portal  body: { projectId }
    scoped.post("/billing/portal", async (req, reply) => {
      const body = z.object({ projectId: z.string().uuid() }).safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: "invalid_body" });
      const [proj] = await db
        .select({
          id: schema.projects.id,
          polarCustomerId: schema.projects.polarCustomerId,
        })
        .from(schema.projects)
        .where(
          and(eq(schema.projects.id, body.data.projectId), eq(schema.projects.ownerId, req.userId!))
        );
      if (!proj) return reply.code(404).send({ error: "project_not_found" });
      if (!proj.polarCustomerId) {
        return reply.code(409).send({ error: "no_active_subscription" });
      }
      try {
        const portal = await polarFetch<{ url: string }>(
          `/customer-portal/sessions?customer_id=${proj.polarCustomerId}`,
          { method: "POST", body: "{}" }
        );
        return { url: portal.url };
      } catch (e) {
        req.log.error({ err: e }, "polar portal failed");
        return reply.code(502).send({ error: "billing_provider_error" });
      }
    });
  });
}
