// Admin-only inbox: lists messages from /var/mail/acrossed-inbox/Maildir/{new,cur}
// (RFC 822 emails delivered by Postfix's virtual_mailbox).
//
// We parse just headers + plain-text body for the list view; full source is
// available via /admin/inbox/:id/raw. Read-only — no SMTP send here.

import type { FastifyInstance } from "fastify";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config.js";

const adminIds = new Set(
  (process.env.ADMIN_CLERK_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
);

function adminAllowed(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const got = req.headers["x-internal-secret"];
  if (typeof got !== "string" || got !== config.INTERNAL_SECRET) return false;
  const uid = req.headers["x-acting-clerk-user-id"];
  return typeof uid === "string" && adminIds.has(uid);
}

const MAILDIR = process.env.INBOX_MAILDIR ?? "/var/mail/acrossed-inbox/Maildir";

interface Header {
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  messageId?: string;
}

function decodeMimeWord(s: string): string {
  // RFC 2047 minimal decode: =?charset?B?...?= and =?charset?Q?...?=
  return s.replace(/=\?([^?]+)\?([BbQq])\?([^?]+)\?=/g, (_, _cs, enc, payload) => {
    try {
      if (enc.toUpperCase() === "B") return Buffer.from(payload, "base64").toString("utf8");
      const q = payload.replace(/_/g, " ").replace(/=([0-9A-F]{2})/gi, (_m: string, h: string) =>
        String.fromCharCode(parseInt(h, 16)),
      );
      return q;
    } catch {
      return payload;
    }
  });
}

function parseHeaders(raw: string): Header {
  const headerEnd = raw.indexOf("\r\n\r\n");
  const headerBlock = (headerEnd >= 0 ? raw.slice(0, headerEnd) : raw).split(/\r?\n/);
  const merged: string[] = [];
  for (const line of headerBlock) {
    if (/^[ \t]/.test(line) && merged.length) merged[merged.length - 1] += " " + line.trim();
    else merged.push(line);
  }
  const h: Header = {};
  for (const line of merged) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    const k = line.slice(0, i).toLowerCase();
    const v = decodeMimeWord(line.slice(i + 1).trim());
    if (k === "from") h.from = v;
    else if (k === "to") h.to = v;
    else if (k === "subject") h.subject = v;
    else if (k === "date") h.date = v;
    else if (k === "message-id") h.messageId = v;
  }
  return h;
}

function parseTextBody(raw: string): string {
  const headerEnd = raw.indexOf("\r\n\r\n");
  if (headerEnd < 0) return "";
  let body = raw.slice(headerEnd + 4);
  // very small multipart handling — pick first text/plain part
  const ctMatch = raw.slice(0, headerEnd).match(/^content-type:\s*(.+)$/im);
  const ct = ctMatch?.[1] ?? "";
  const boundaryMatch = ct.match(/boundary="?([^";\r\n]+)"?/i);
  if (boundaryMatch) {
    const b = "--" + boundaryMatch[1];
    const parts = body.split(b).map((p) => p.trim()).filter(Boolean);
    const text = parts.find((p) => /content-type:\s*text\/plain/i.test(p));
    if (text) {
      const e = text.indexOf("\r\n\r\n");
      if (e >= 0) body = text.slice(e + 4);
    }
  }
  return body.slice(0, 20000);
}

async function listMaildir(): Promise<Array<{ id: string; mtime: number; raw: string; new: boolean }>> {
  const out: Array<{ id: string; mtime: number; raw: string; new: boolean }> = [];
  for (const sub of ["new", "cur"] as const) {
    const dir = path.join(MAILDIR, sub);
    let entries: string[] = [];
    try { entries = await fs.readdir(dir); } catch { continue; }
    for (const name of entries) {
      const full = path.join(dir, name);
      try {
        const st = await fs.stat(full);
        if (!st.isFile()) continue;
        const raw = await fs.readFile(full, "utf8");
        out.push({ id: encodeURIComponent(`${sub}/${name}`), mtime: st.mtimeMs, raw, new: sub === "new" });
      } catch { /* skip */ }
    }
  }
  out.sort((a, b) => b.mtime - a.mtime);
  return out;
}

export async function inboxRoutes(app: FastifyInstance): Promise<void> {
  app.get("/admin/inbox", async (req, reply) => {
    if (!adminAllowed(req)) return reply.code(403).send({ error: "forbidden" });
    const list = await listMaildir();
    return {
      maildir: MAILDIR,
      count: list.length,
      messages: list.slice(0, 200).map((m) => {
        const h = parseHeaders(m.raw);
        return {
          id: m.id,
          new: m.new,
          mtime: new Date(m.mtime).toISOString(),
          from: h.from ?? "",
          to: h.to ?? "",
          subject: h.subject ?? "(no subject)",
          date: h.date ?? "",
          preview: parseTextBody(m.raw).replace(/\s+/g, " ").trim().slice(0, 200),
        };
      }),
    };
  });

  app.get("/admin/inbox/:id", async (req, reply) => {
    if (!adminAllowed(req)) return reply.code(403).send({ error: "forbidden" });
    const id = decodeURIComponent((req.params as { id: string }).id);
    if (id.includes("..") || !/^(new|cur)\//.test(id)) return reply.code(400).send({ error: "bad_id" });
    const full = path.join(MAILDIR, id);
    try {
      const raw = await fs.readFile(full, "utf8");
      const h = parseHeaders(raw);
      return {
        id: encodeURIComponent(id),
        from: h.from ?? "", to: h.to ?? "", subject: h.subject ?? "(no subject)",
        date: h.date ?? "", messageId: h.messageId ?? "",
        body: parseTextBody(raw),
        rawSize: raw.length,
      };
    } catch (err) {
      return reply.code(404).send({ error: "not_found" });
    }
  });
}
