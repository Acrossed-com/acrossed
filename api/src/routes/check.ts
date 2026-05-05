import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { hashKey } from "../lib/keys.js";
import { getByKeyHash, tryConsumeQuota } from "../engine/store.js";
import { evaluate } from "../engine/evaluator.js";
import { verify } from "../crypto/hmac.js";
import { record } from "../engine/usageBuffer.js";
import { planFor } from "../lib/plans.js";
import { logDecision } from "../lib/logSink.js";

const bodySchema = z.object({
  ip: z.string().optional(),
  method: z.string().default("GET"),
  path: z.string().default("/"),
  headers: z.record(z.string(), z.string()).default({}),
  query: z.record(z.string(), z.string()).default({}),
});

function clientIp(req: FastifyRequest): string {
  const xff = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  return xff || req.ip || "0.0.0.0";
}

export async function checkRoutes(app: FastifyInstance): Promise<void> {
  app.post("/check", async (req, reply) => {
    const apiKey = req.headers["x-acrossed-key"];
    if (typeof apiKey !== "string" || !apiKey) {
      return reply.code(401).send({ decision: "deny", reason: "missing_api_key" });
    }
    const entry = getByKeyHash(hashKey(apiKey));
    if (!entry) {
      return reply.code(401).send({ decision: "deny", reason: "invalid_api_key" });
    }

    const rawBody = (req as FastifyRequest & { rawBody?: string }).rawBody ?? "";

    const v = verify(entry.signingSecret, rawBody, {
      timestamp: req.headers["x-acrossed-timestamp"] as string | undefined,
      signature: req.headers["x-acrossed-signature"] as string | undefined,
    });
    if (!v.ok) {
      return reply.code(401).send({ decision: "deny", reason: v.reason });
    }

    if (!tryConsumeQuota(entry)) {
      const plan = planFor(entry.plan);
      reply.header("x-acrossed-plan", entry.plan);
      reply.header("x-acrossed-quota-cap", String(plan.monthlyChecks));
      return reply.code(402).send({
        decision: "deny",
        reason: "quota_exceeded",
        plan: entry.plan,
        upgradeUrl: "https://acrossed.com/dashboard/billing",
      });
    }

    let parsed: z.infer<typeof bodySchema>;
    try {
      parsed = bodySchema.parse(rawBody.length > 0 ? JSON.parse(rawBody) : {});
    } catch {
      return reply.code(400).send({ decision: "deny", reason: "invalid_body" });
    }

    const ip = parsed.ip || clientIp(req);
    const headersLower: Record<string, string> = {};
    for (const [k, val] of Object.entries(parsed.headers)) {
      headersLower[k.toLowerCase()] = val;
    }

    const decision = evaluate(entry.rules, {
      projectId: entry.projectId,
      ip,
      method: parsed.method,
      path: parsed.path,
      headers: headersLower,
      query: parsed.query,
    });

    record(entry.projectId, decision.decision);
    reply.header("x-acrossed-latency-us", String(decision.latencyUs));
    reply.header("x-acrossed-quota-used", String(entry.quota.used));

    // Fire-and-forget BYO log sink. Off the response path; never awaited.
    if (entry.logSinkEnabled) {
      logDecision(entry.projectId, {
        decision: decision.decision,
        reason: decision.reason,
        ruleId: decision.matchedRule,
        ip,
        method: parsed.method,
        path: parsed.path,
        userAgent: headersLower["user-agent"],
        latencyUs: decision.latencyUs,
      });
    }

    return decision;
  });
}
