// In-memory store. On boot we hydrate from Postgres (decrypting each project's
// ruleset). After that, the hot path NEVER touches the DB.
//
// Quota state lives here too: monthlyChecks counter + reset timestamp. We hard-cap
// at planFor(entry.plan).monthlyChecks to enforce billing without DB lookups.
import { db, schema } from "../db/index.js";
import { decryptString, encrypt } from "../crypto/aes.js";
import type { Ruleset } from "./evaluator.js";
import { eq } from "drizzle-orm";
import { type PlanId, planFor, currentBillingPeriodStart } from "../lib/plans.js";
import { setSink, clearSink, clearAllSinks } from "../lib/logSink.js";

export interface Entry {
  projectId: string;
  apiKeyHash: string;
  signingSecret: string;
  rules: Ruleset;
  plan: PlanId;
  // Quota: per-month check count, reset at the 1st of each month UTC.
  quota: { used: number; resetAt: number };
  // BYO log sink: true when a Postgres URL is configured + enabled. The pool
  // itself lives inside lib/logSink.ts.
  logSinkEnabled: boolean;
}

const byKeyHash = new Map<string, Entry>();
const byProjectId = new Map<string, Entry>();
const bySlug = new Map<string, string>();

function freshQuota(): { used: number; resetAt: number } {
  return { used: 0, resetAt: nextResetAt() };
}

function nextResetAt(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
}

export async function hydrate(): Promise<number> {
  // Tear down any existing pg.Pool instances from a previous hydrate first,
  // otherwise re-hydration leaks file descriptors + idle connections to user DBs.
  clearAllSinks();
  byKeyHash.clear();
  byProjectId.clear();
  bySlug.clear();
  const rows = await db.select().from(schema.projects);
  const usageRows = await db.select().from(schema.usage);
  const usageByProject = new Map(usageRows.map((u) => [u.projectId, u]));
  const periodStart = currentBillingPeriodStart();

  for (const row of rows) {
    try {
      const rulesJson = decryptString(row.encryptedRules);
      const signingSecret = decryptString(row.signingSecretEncrypted);
      const rules = JSON.parse(rulesJson) as Ruleset;
      const u = usageByProject.get(row.id);
      const stillCurrent = u && u.monthlyResetAt && u.monthlyResetAt.getTime() >= periodStart;

      // Bootstrap log sink if enabled at boot.
      const sinkEnabled = !!row.logSinkEnabled && !!row.logSinkUrlEncrypted;
      if (sinkEnabled) {
        try {
          const url = decryptString(row.logSinkUrlEncrypted!);
          setSink(row.id, url, row.logSinkTable ?? "acrossed_decisions");
        } catch (e) {
          console.error(`[store] failed to hydrate log sink for ${row.id}:`, e);
        }
      }

      const entry: Entry = {
        projectId: row.id,
        apiKeyHash: row.apiKeyHash,
        signingSecret,
        rules,
        plan: (row.plan as PlanId) ?? "free",
        quota: stillCurrent
          ? { used: Number(u!.monthlyChecks ?? 0), resetAt: nextResetAt() }
          : freshQuota(),
        logSinkEnabled: sinkEnabled,
      };
      byKeyHash.set(row.apiKeyHash, entry);
      byProjectId.set(row.id, entry);
      if (row.slug) bySlug.set(row.slug, row.id);
    } catch (e) {
      console.error(`[store] failed to hydrate project ${row.id}:`, e);
    }
  }
  return byKeyHash.size;
}

export function getByKeyHash(hash: string): Entry | undefined {
  return byKeyHash.get(hash);
}
export function getByProjectId(id: string): Entry | undefined {
  return byProjectId.get(id);
}
export function getProjectIdBySlug(slug: string): string | undefined {
  return bySlug.get(slug);
}

export async function upsertRules(projectId: string, rules: Ruleset): Promise<void> {
  const json = JSON.stringify(rules);
  const enc = encrypt(json);
  await db
    .update(schema.projects)
    .set({ encryptedRules: enc, updatedAt: new Date() })
    .where(eq(schema.projects.id, projectId));
  const cur = byProjectId.get(projectId);
  if (cur) cur.rules = rules;
}

export function registerNewProject(entry: Omit<Entry, "quota" | "plan" | "logSinkEnabled"> & { plan?: PlanId; slug?: string }): void {
  const full: Entry = {
    ...entry,
    plan: entry.plan ?? "free",
    quota: freshQuota(),
    logSinkEnabled: false,
  };
  byKeyHash.set(full.apiKeyHash, full);
  byProjectId.set(full.projectId, full);
  if (entry.slug) bySlug.set(entry.slug, full.projectId);
}

export function setProjectPlan(projectId: string, plan: PlanId): void {
  const cur = byProjectId.get(projectId);
  if (cur) cur.plan = plan;
}

export function removeProject(projectId: string): void {
  const cur = byProjectId.get(projectId);
  if (!cur) return;
  byKeyHash.delete(cur.apiKeyHash);
  byProjectId.delete(projectId);
  for (const [slug, pid] of bySlug) {
    if (pid === projectId) {
      bySlug.delete(slug);
      break;
    }
  }
  // Tear down the BYO sink pool too.
  clearSink(projectId);
}

/**
 * Activate or update a project's BYO log sink in memory. Called by the
 * /projects/:id/log-sink PUT route after persisting + encrypting the URL.
 */
export function activateLogSink(projectId: string, plaintextUrl: string, tableName: string): void {
  setSink(projectId, plaintextUrl, tableName);
  const cur = byProjectId.get(projectId);
  if (cur) cur.logSinkEnabled = true;
}

export function deactivateLogSink(projectId: string): void {
  clearSink(projectId);
  const cur = byProjectId.get(projectId);
  if (cur) cur.logSinkEnabled = false;
}

export function tryConsumeQuota(entry: Entry): boolean {
  const now = Date.now();
  if (now >= entry.quota.resetAt) {
    entry.quota.used = 0;
    entry.quota.resetAt = nextResetAt();
  }
  const cap = planFor(entry.plan).monthlyChecks;
  if (entry.quota.used >= cap) return false;
  entry.quota.used += 1;
  return true;
}
