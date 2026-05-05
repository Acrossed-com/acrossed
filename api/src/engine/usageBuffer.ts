// Best-effort batched usage counters. We accumulate in memory and flush every 5s.
// Critically, the same flush also persists the monthly-quota counter that the
// in-memory quota gate relies on, so process restarts cannot reset usage and
// let a customer exceed their plan cap mid-period.
import { db } from "../db/index.js";
import { sql } from "drizzle-orm";
import { currentBillingPeriodStart } from "../lib/plans.js";

interface Bucket { req: number; allow: number; deny: number; }
const buf = new Map<string, Bucket>();

export function record(projectId: string, decision: "allow" | "deny"): void {
  const b = buf.get(projectId) ?? { req: 0, allow: 0, deny: 0 };
  b.req += 1;
  if (decision === "allow") b.allow += 1;
  else b.deny += 1;
  buf.set(projectId, b);
}

async function flush(): Promise<void> {
  if (buf.size === 0) return;
  const snapshot = Array.from(buf.entries());
  buf.clear();
  // ISO timestamp at the start of the current billing period UTC. If the row's
  // stored monthly_reset_at predates this, the period rolled over and the
  // monthly counter must be reset (not added to).
  const periodStartIso = new Date(currentBillingPeriodStart()).toISOString();
  for (const [projectId, b] of snapshot) {
    try {
      await db.execute(sql`
        INSERT INTO usage (
          project_id, request_count, allowed_count, denied_count,
          monthly_checks, monthly_reset_at, updated_at
        )
        VALUES (
          ${projectId}::uuid, ${b.req}, ${b.allow}, ${b.deny},
          ${b.req}, now(), now()
        )
        ON CONFLICT (project_id) DO UPDATE SET
          request_count = usage.request_count + EXCLUDED.request_count,
          allowed_count = usage.allowed_count + EXCLUDED.allowed_count,
          denied_count  = usage.denied_count  + EXCLUDED.denied_count,
          monthly_checks = CASE
            WHEN usage.monthly_reset_at < ${periodStartIso}::timestamptz
              THEN EXCLUDED.monthly_checks
            ELSE usage.monthly_checks + EXCLUDED.monthly_checks
          END,
          monthly_reset_at = CASE
            WHEN usage.monthly_reset_at < ${periodStartIso}::timestamptz
              THEN now()
            ELSE usage.monthly_reset_at
          END,
          updated_at = now()
      `);
    } catch (e) {
      console.error("[usageBuffer] flush error", e);
    }
  }
}

export function startUsageFlusher(): void {
  setInterval(() => { flush().catch(() => {}); }, 5_000).unref();
}
