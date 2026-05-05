// BYO Postgres log sink CRUD. All routes scoped to /projects/:id/log-sink and
// guarded by Clerk auth via the global preHandler. Owner check is enforced
// against the project row.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { encrypt, decryptString } from "../crypto/aes.js";
import { requireUser } from "../middleware/clerkAuth.js";
import { activateLogSink, deactivateLogSink, getByProjectId } from "../engine/store.js";
import { testConnection, getSinkStatus } from "../lib/logSink.js";

const URL_RE = /^postgres(?:ql)?:\/\/[^\s]+$/i;
const TABLE_RE = /^[a-z][a-z0-9_]{0,62}$/;

const putSchema = z.object({
  url: z.string().regex(URL_RE, "must be a postgres:// or postgresql:// URL"),
  table: z.string().regex(TABLE_RE, "lowercase letters, digits, underscores").optional(),
  enabled: z.boolean().optional(),
});

const testSchema = z.object({
  url: z.string().regex(URL_RE),
  table: z.string().regex(TABLE_RE).optional(),
});

// Redact a connection string for display: scheme://USER:****@host:port/db?…
function redactUrl(url: string): { display: string; host: string; database: string } {
  try {
    const u = new URL(url);
    const host = u.hostname + (u.port ? `:${u.port}` : "");
    const db = u.pathname.replace(/^\//, "") || "(default)";
    const user = u.username || "user";
    return { display: `${u.protocol}//${user}:****@${host}/${db}`, host, database: db };
  } catch {
    return { display: "(invalid url)", host: "", database: "" };
  }
}

async function loadOwnedProject(userId: string, id: string) {
  const [row] = await db.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
  if (!row) return { error: "not_found" as const };
  if (row.ownerId !== userId) return { error: "forbidden" as const };
  return { row };
}

export async function logSinkRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", requireUser);

  // GET current configuration (URL is never returned in plaintext).
  app.get("/projects/:id/log-sink", async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await loadOwnedProject(req.userId!, id);
    if ("error" in r) return reply.code(r.error === "forbidden" ? 403 : 404).send({ error: r.error });

    const status = getSinkStatus(id);
    const display = r.row.logSinkUrlEncrypted
      ? redactUrl(safeDecrypt(r.row.logSinkUrlEncrypted))
      : null;

    return {
      configured: !!r.row.logSinkUrlEncrypted,
      enabled: r.row.logSinkEnabled,
      active: status.active,
      table: r.row.logSinkTable,
      display: display?.display ?? null,
      host: display?.host ?? null,
      database: display?.database ?? null,
      lastError: r.row.logSinkLastError ?? status.lastError ?? null,
      lastErrorAt: r.row.logSinkLastErrorAt
        ? r.row.logSinkLastErrorAt.toISOString()
        : status.lastErrorAt
          ? new Date(status.lastErrorAt).toISOString()
          : null,
    };
  });

  // POST /test — connect, run SELECT 1, attempt to bootstrap the table.
  // Does NOT persist anything. Used by the dashboard "Test connection" button.
  app.post("/projects/:id/log-sink/test", async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await loadOwnedProject(req.userId!, id);
    if ("error" in r) return reply.code(r.error === "forbidden" ? 403 : 404).send({ error: r.error });

    const parsed = testSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: parsed.error.issues[0]?.message ?? "invalid_body" });
    }
    const result = await testConnection(parsed.data.url, parsed.data.table ?? r.row.logSinkTable);
    return result;
  });

  // PUT — save (and optionally enable) the sink. Encrypts the URL with our
  // master key before INSERT/UPDATE. If enabled=true we also activate the
  // in-memory pool so subsequent /check calls log immediately.
  app.put("/projects/:id/log-sink", async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await loadOwnedProject(req.userId!, id);
    if ("error" in r) return reply.code(r.error === "forbidden" ? 403 : 404).send({ error: r.error });

    const parsed = putSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "invalid_body" });
    }
    const { url, table, enabled } = parsed.data;
    const tableName = table ?? r.row.logSinkTable ?? "acrossed_decisions";

    // Verify the connection works before persisting bad config.
    const test = await testConnection(url, tableName);
    if (!test.ok) {
      return reply.code(400).send({ error: `connection_failed: ${test.error ?? "unknown"}` });
    }

    const enc = encrypt(url);
    const shouldEnable = enabled !== false; // default to true on PUT
    await db
      .update(schema.projects)
      .set({
        logSinkUrlEncrypted: enc,
        logSinkTable: tableName,
        logSinkEnabled: shouldEnable,
        logSinkLastError: null,
        logSinkLastErrorAt: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, id));

    if (shouldEnable) {
      activateLogSink(id, url, tableName);
    } else {
      deactivateLogSink(id);
    }
    return { ok: true, enabled: shouldEnable };
  });

  // PATCH — toggle enabled flag without re-supplying URL.
  app.patch("/projects/:id/log-sink", async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await loadOwnedProject(req.userId!, id);
    if ("error" in r) return reply.code(r.error === "forbidden" ? 403 : 404).send({ error: r.error });

    const parsed = z.object({ enabled: z.boolean() }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "enabled boolean required" });

    if (!r.row.logSinkUrlEncrypted) {
      return reply.code(400).send({ error: "no_sink_configured" });
    }

    await db
      .update(schema.projects)
      .set({ logSinkEnabled: parsed.data.enabled, updatedAt: new Date() })
      .where(eq(schema.projects.id, id));

    if (parsed.data.enabled) {
      try {
        const url = decryptString(r.row.logSinkUrlEncrypted);
        activateLogSink(id, url, r.row.logSinkTable ?? "acrossed_decisions");
      } catch (e) {
        return reply.code(500).send({ error: "failed_to_decrypt_url" });
      }
    } else {
      deactivateLogSink(id);
    }
    return { ok: true, enabled: parsed.data.enabled };
  });

  // DELETE — remove the sink entirely.
  app.delete("/projects/:id/log-sink", async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await loadOwnedProject(req.userId!, id);
    if ("error" in r) return reply.code(r.error === "forbidden" ? 403 : 404).send({ error: r.error });

    deactivateLogSink(id);
    await db
      .update(schema.projects)
      .set({
        logSinkUrlEncrypted: null,
        logSinkEnabled: false,
        logSinkLastError: null,
        logSinkLastErrorAt: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, id));
    return { ok: true };
  });
}

function safeDecrypt(enc: string): string {
  try {
    return decryptString(enc);
  } catch {
    return "";
  }
}
