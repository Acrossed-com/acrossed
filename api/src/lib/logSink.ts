// Per-project bring-your-own Postgres log sink.
//
// Design: each project that opts in gets a dedicated pg.Pool (max 2 conns).
// After every /check decision, we INSERT a row into their `acrossed_decisions`
// table — fire-and-forget, never blocking the response. If the user's DB is
// down or rejects, we update lastError on the entry and drop the row. The
// /check path is never affected by their DB's health.
import pg from "pg";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";

interface SinkEntry {
  pool: pg.Pool;
  tableName: string;
  // Quoted identifier ready for raw SQL: `"acrossed_decisions"`. Defense in
  // depth — even though TABLE_RE already restricts to [a-z0-9_], wrapping the
  // identifier means a future regex relaxation can't introduce SQL injection.
  quotedTable: string;
  bootstrapped: boolean;
  // Promise gate to prevent N concurrent CREATE TABLE bursts on first traffic
  // after enable / hydrate. All concurrent first-inserts await the same promise.
  bootstrapping?: Promise<void>;
  lastError?: { message: string; at: number };
}

const sinks = new Map<string, SinkEntry>();

// Hard cap: per-project pool stays small so 1000s of opted-in projects don't
// exhaust file descriptors. We aim for fast failure over throughput.
function buildPool(connectionString: string): pg.Pool {
  const ssl = needsSsl(connectionString);
  return new pg.Pool({
    connectionString,
    max: 2,
    min: 0,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 5_000,
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
  });
}

function needsSsl(url: string): boolean {
  try {
    const u = new URL(url);
    const sslmode = u.searchParams.get("sslmode");
    if (sslmode === "disable") return false;
    if (sslmode) return true;
    // Default: enable SSL for known managed Postgres hosts.
    const host = u.hostname.toLowerCase();
    return /(neon|supabase|render|rds\.amazonaws|cockroachlabs|aiven|crunchydata)/.test(host);
  } catch {
    return false;
  }
}

// Builds DDL using a quoted identifier. The bare-name version is used for index
// names where Postgres requires an unquoted identifier in our schema.
const CREATE_TABLE_TEMPLATE = (quotedTable: string, bareName: string) => `
CREATE TABLE IF NOT EXISTS ${quotedTable} (
  id bigserial PRIMARY KEY,
  ts timestamptz NOT NULL DEFAULT now(),
  decision text NOT NULL,
  reason text,
  rule_id text,
  ip text,
  method text,
  path text,
  user_agent text,
  latency_us integer
);
CREATE INDEX IF NOT EXISTS ${bareName}_ts_idx ON ${quotedTable}(ts DESC);
CREATE INDEX IF NOT EXISTS ${bareName}_decision_ts_idx ON ${quotedTable}(decision, ts DESC);
`;

// Sanitize the table name (defense in depth — schema/route already validates
// against /^[a-z][a-z0-9_]{0,62}$/). Strip anything that isn't [a-z0-9_] and
// cap length at 63 (Postgres NAMEDATALEN - 1).
function safeTableName(name: string): string {
  return name.replace(/[^a-z0-9_]/gi, "").slice(0, 63) || "acrossed_decisions";
}

// Wrap a sanitized name as a quoted Postgres identifier. After safeTableName,
// the input contains no double quotes, so escaping is a no-op — but we keep
// the .replace for explicit intent.
function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Attempt to connect, run SELECT 1, and bootstrap the table. Returns ok/error
 * for the test endpoint. Does NOT register the pool in the global map — caller
 * decides whether to persist + activate.
 */
export async function testConnection(
  connectionString: string,
  tableName: string,
): Promise<{ ok: boolean; error?: string; tableCreated?: boolean }> {
  const tbl = safeTableName(tableName);
  let pool: pg.Pool | null = null;
  try {
    pool = buildPool(connectionString);
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      const quoted = quoteIdent(tbl);
      await client.query(CREATE_TABLE_TEMPLATE(quoted, tbl));
      // Try a no-op INSERT inside an aborted transaction to confirm permissions
      // without leaving a row behind.
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO ${quoted} (decision, reason) VALUES ($1, $2)`,
        ["allow", "__acrossed_test__"],
      );
      await client.query("ROLLBACK");
      return { ok: true, tableCreated: true };
    } finally {
      client.release();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.slice(0, 300) };
  } finally {
    if (pool) {
      await pool.end().catch(() => undefined);
    }
  }
}

/**
 * Register or replace a project's log sink in the in-memory map. Called on
 * boot (hydrate) and after every PUT /log-sink. Bootstraps the table on
 * first use (lazy).
 */
export function setSink(projectId: string, connectionString: string, tableName: string): void {
  // Tear down any existing pool first.
  clearSink(projectId);
  const tbl = safeTableName(tableName);
  const pool = buildPool(connectionString);
  // Suppress 'error' events on idle clients so a network blip doesn't crash the API.
  pool.on("error", (err) => {
    const cur = sinks.get(projectId);
    if (cur) cur.lastError = { message: err.message.slice(0, 300), at: Date.now() };
  });
  sinks.set(projectId, {
    pool,
    tableName: tbl,
    quotedTable: quoteIdent(tbl),
    bootstrapped: false,
  });
}

export function clearSink(projectId: string): void {
  const cur = sinks.get(projectId);
  if (!cur) return;
  cur.pool.end().catch(() => undefined);
  sinks.delete(projectId);
}

/**
 * Tear down every active sink. Called by store.hydrate() before rebuilding
 * the in-memory map so we don't leak pg.Pool instances across re-hydrations.
 */
export function clearAllSinks(): void {
  for (const id of [...sinks.keys()]) {
    clearSink(id);
  }
}

export interface LogRow {
  decision: "allow" | "deny";
  reason?: string;
  ruleId?: string;
  ip?: string;
  method?: string;
  path?: string;
  userAgent?: string;
  latencyUs?: number;
}

/**
 * Fire-and-forget row insert. Never throws. Never awaited from /check.
 * Bootstraps the table on first call if needed.
 */
export function logDecision(projectId: string, row: LogRow): void {
  const entry = sinks.get(projectId);
  if (!entry) return;

  // Schedule on next tick so we never compete with the response write.
  setImmediate(() => {
    void doInsert(projectId, entry, row);
  });
}

async function doInsert(projectId: string, entry: SinkEntry, row: LogRow): Promise<void> {
  try {
    // Single-flight bootstrap: under traffic burst, the first N concurrent
    // inserts all await the same CREATE TABLE promise instead of issuing N
    // redundant DDLs against the user's DB.
    if (!entry.bootstrapped) {
      if (!entry.bootstrapping) {
        entry.bootstrapping = entry.pool
          .query(CREATE_TABLE_TEMPLATE(entry.quotedTable, entry.tableName))
          .then(() => {
            entry.bootstrapped = true;
          })
          .catch((e: unknown) => {
            // Reset so a transient failure (DB briefly down) doesn't permanently
            // wedge the sink — the next call will retry the bootstrap.
            entry.bootstrapping = undefined;
            throw e;
          });
      }
      await entry.bootstrapping;
    }
    await entry.pool.query(
      `INSERT INTO ${entry.quotedTable}
        (decision, reason, rule_id, ip, method, path, user_agent, latency_us)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        row.decision,
        row.reason ?? null,
        row.ruleId ?? null,
        row.ip ?? null,
        row.method ?? null,
        row.path ?? null,
        row.userAgent ?? null,
        row.latencyUs ?? null,
      ],
    );
    // Clear last error on success so the dashboard reflects recovery.
    if (entry.lastError) entry.lastError = undefined;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    entry.lastError = { message: msg.slice(0, 300), at: Date.now() };
    // Persist most-recent error to DB for dashboard display (best-effort, throttled).
    void persistLastError(projectId, msg).catch(() => undefined);
  }
}

// Throttle the DB write of last_error so a flapping sink doesn't flood our DB.
const lastErrorWriteAt = new Map<string, number>();
async function persistLastError(projectId: string, message: string): Promise<void> {
  const now = Date.now();
  const prev = lastErrorWriteAt.get(projectId) ?? 0;
  if (now - prev < 60_000) return; // at most once per minute per project
  lastErrorWriteAt.set(projectId, now);
  await db
    .update(schema.projects)
    .set({
      logSinkLastError: message.slice(0, 300),
      logSinkLastErrorAt: new Date(),
    })
    .where(eq(schema.projects.id, projectId));
}

export function getSinkStatus(projectId: string): { active: boolean; lastError?: string; lastErrorAt?: number } {
  const e = sinks.get(projectId);
  if (!e) return { active: false };
  return {
    active: true,
    lastError: e.lastError?.message,
    lastErrorAt: e.lastError?.at,
  };
}
