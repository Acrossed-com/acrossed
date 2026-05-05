import type { FastifyInstance } from "fastify";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { config } from "../config.js";
import { db, schema } from "../db/index.js";
import { setProjectPlan } from "../engine/store.js";
import type { PlanId } from "../lib/plans.js";

// Polar webhook (subscriptions, etc). Signature header: `webhook-signature`.
// Format: `v1,<base64 sig>` where sig = HMAC-SHA256(secret, `${id}.${ts}.${body}`).
//
// On `subscription.created` / `subscription.active` we flip the project's plan
// in both Postgres and the in-memory store so the new quota cap is live without
// a process restart. On `subscription.canceled` we drop back to free.
export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.post("/webhooks/polar", async (req, reply) => {
    const secret = config.POLAR_WEBHOOK_SECRET;
    if (!secret) return reply.code(503).send({ error: "polar_not_configured" });

    const id = req.headers["webhook-id"] as string | undefined;
    const ts = req.headers["webhook-timestamp"] as string | undefined;
    const sigHeader = req.headers["webhook-signature"] as string | undefined;
    if (!id || !ts || !sigHeader) {
      return reply.code(400).send({ error: "missing_signature_headers" });
    }

    const raw =
      (req as typeof req & { rawBody?: string }).rawBody ??
      (typeof req.body === "string" ? req.body : JSON.stringify(req.body));
    const expected = createHmac("sha256", secret).update(`${id}.${ts}.${raw}`).digest("base64");

    const candidates = sigHeader.split(" ").map((p) => p.replace(/^v1,/, ""));
    const ok = candidates.some((c) => {
      try {
        const a = Buffer.from(c, "base64");
        const b = Buffer.from(expected, "base64");
        return a.length === b.length && timingSafeEqual(a, b);
      } catch {
        return false;
      }
    });
    if (!ok) return reply.code(401).send({ error: "invalid_signature" });

    let event: { type?: string; data?: Record<string, unknown> } = {};
    try {
      event = JSON.parse(raw);
    } catch {
      return reply.code(400).send({ error: "invalid_json" });
    }

    const data = (event.data ?? {}) as Record<string, unknown>;
    const meta = (data.metadata ?? {}) as { project_id?: string; plan?: PlanId };
    const projectId = meta.project_id;
    const customerId = (data.customer_id as string | undefined) ?? null;
    const subscriptionId = (data.id as string | undefined) ?? null;

    if (!projectId) {
      req.log.warn({ event: event.type }, "polar webhook missing project_id metadata");
      return { ok: true, ignored: true };
    }

    switch (event.type) {
      case "subscription.created":
      case "subscription.active":
      case "subscription.updated": {
        const plan: PlanId = (meta.plan === "scale" || meta.plan === "business" || meta.plan === "enterprise") ? meta.plan : "pro";
        await db
          .update(schema.projects)
          .set({
            plan,
            polarCustomerId: customerId ?? undefined,
            polarSubscriptionId: subscriptionId ?? undefined,
            updatedAt: new Date(),
          })
          .where(eq(schema.projects.id, projectId));
        setProjectPlan(projectId, plan);
        req.log.info({ projectId, plan }, "plan upgraded via polar");
        break;
      }
      case "subscription.canceled":
      case "subscription.revoked": {
        await db
          .update(schema.projects)
          .set({ plan: "free", polarSubscriptionId: null, updatedAt: new Date() })
          .where(eq(schema.projects.id, projectId));
        setProjectPlan(projectId, "free");
        req.log.info({ projectId }, "plan reverted to free via polar");
        break;
      }
      default:
        req.log.info({ event: event.type }, "polar webhook (no-op)");
    }
    return { ok: true };
  });
}
