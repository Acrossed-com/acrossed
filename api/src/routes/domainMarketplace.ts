// Admin domain marketplace CRUD. Stores domain listings in a JSON file
// for simplicity (no separate DB table needed for a small catalog).
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { randomUUID } from "node:crypto";

const adminIds = new Set(
  (process.env.ADMIN_CLERK_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
);

function adminAllowed(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const got = req.headers["x-internal-secret"];
  if (typeof got !== "string" || got !== config.INTERNAL_SECRET) return false;
  const uid = req.headers["x-acting-clerk-user-id"] || req.headers["x-user-id"];
  if (typeof uid === "string" && adminIds.has(uid)) return true;
  // Allow read-only listing without admin check for public page
  return false;
}

interface DomainListing {
  id: string;
  domain: string;
  price: string;
  description: string;
  category: string;
  featured: boolean;
  status: "available" | "sold" | "reserved";
  createdAt: string;
}

const DATA_FILE = path.join(process.env.DATA_DIR ?? "/var/www/acrossed/api", "domains.json");

async function loadDomains(): Promise<DomainListing[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveDomains(domains: DomainListing[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(domains, null, 2), "utf8");
}

export async function domainMarketplaceRoutes(app: FastifyInstance): Promise<void> {
  // Public read: no auth needed
  app.get("/admin/domains", async (req) => {
    const domains = await loadDomains();
    return domains;
  });

  // Admin write endpoints
  app.post("/admin/domains", async (req, reply) => {
    if (!adminAllowed(req)) return reply.code(403).send({ error: "forbidden" });
    const schema = z.object({
      domain: z.string().min(3),
      price: z.string().default("Make offer"),
      description: z.string().default(""),
      category: z.string().default(""),
      featured: z.boolean().default(false),
      status: z.enum(["available", "sold", "reserved"]).default("available"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body", details: parsed.error.issues });

    const domains = await loadDomains();
    const entry: DomainListing = {
      id: randomUUID(),
      ...parsed.data,
      createdAt: new Date().toISOString(),
    };
    domains.push(entry);
    await saveDomains(domains);
    return entry;
  });

  app.put("/admin/domains/:id", async (req, reply) => {
    if (!adminAllowed(req)) return reply.code(403).send({ error: "forbidden" });
    const { id } = req.params as { id: string };
    const domains = await loadDomains();
    const idx = domains.findIndex((d) => d.id === id);
    if (idx < 0) return reply.code(404).send({ error: "not_found" });

    const updates = req.body as Partial<DomainListing>;
    domains[idx] = { ...domains[idx], ...updates, id };
    await saveDomains(domains);
    return domains[idx];
  });

  app.delete("/admin/domains/:id", async (req, reply) => {
    if (!adminAllowed(req)) return reply.code(403).send({ error: "forbidden" });
    const { id } = req.params as { id: string };
    const domains = await loadDomains();
    const filtered = domains.filter((d) => d.id !== id);
    if (filtered.length === domains.length) return reply.code(404).send({ error: "not_found" });
    await saveDomains(filtered);
    return { ok: true };
  });
}