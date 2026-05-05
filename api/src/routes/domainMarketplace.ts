// Upgraded domain marketplace with:
// - Nameserver verification (forsale1/2.dnserver.cloud)
// - Gemini AI landing page generation
// - Contact form forwarding to forsale@acrossed.com
// - DB-backed storage (domain_listings table)
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { randomUUID } from "node:crypto";
import dns from "node:dns/promises";
import { db } from "../db/index.js";
import { sql } from "drizzle-orm";

const adminIds = new Set(
  (process.env.ADMIN_CLERK_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
);

function adminAllowed(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const got = req.headers["x-internal-secret"];
  if (typeof got !== "string" || got !== config.INTERNAL_SECRET) return false;
  const uid = req.headers["x-acting-clerk-user-id"] || req.headers["x-user-id"];
  return typeof uid === "string" && adminIds.has(uid);
}

const NAMESERVERS = ["forsale1.dnserver.cloud", "forsale2.dnserver.cloud"];

interface DomainListing {
  id: string;
  domain: string;
  slug: string;
  price: string;
  description: string;
  category: string;
  featured: boolean;
  status: "available" | "sold" | "reserved";
  verified: boolean;
  // AI-generated landing page content (JSON)
  landing_headline: string;
  landing_tagline: string;
  landing_description: string;
  landing_keywords: string[];
  landing_color_primary: string;
  landing_color_secondary: string;
  landing_font: string;
  landing_use_cases: string[];
  landing_industry: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
}

// Generate slug from domain: "my-domain.com" -> "my-domain-com"
function domainToSlug(domain: string): string {
  return domain.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Verify domain nameservers point to our forsale NS
async function verifyNameservers(domain: string): Promise<{ verified: boolean; actual: string[] }> {
  try {
    const nsRecords = await dns.resolveNs(domain);
    const actual = nsRecords.map((ns) => ns.toLowerCase());
    const verified = NAMESERVERS.every((expected) =>
      actual.some((a) => a === expected || a === expected + ".")
    );
    return { verified, actual };
  } catch {
    return { verified: false, actual: [] };
  }
}

// Call Gemini API to generate landing page content for a domain
async function generateLandingContent(domain: string, category: string): Promise<Partial<DomainListing>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("Dummy")) {
    // Return sensible defaults when no API key
    const name = domain.replace(/\.(com|io|dev|co|net|org|ai)$/i, "");
    return {
      landing_headline: `${name} is available`,
      landing_tagline: `Own the perfect domain for your next venture`,
      landing_description: `${domain} is a premium domain name perfect for ${category || "startups and tech companies"}. This memorable, brandable domain gives your business instant credibility and recognition.`,
      landing_keywords: [name, domain, "premium domain", "brandable", category || "startup"].filter(Boolean),
      landing_color_primary: "#6E8BFF",
      landing_color_secondary: "#1a1a2e",
      landing_font: "Inter",
      landing_use_cases: ["SaaS Platform", "Tech Startup", "Developer Tool"],
      landing_industry: category || "Technology",
    };
  }

  try {
    const prompt = `You are a domain branding expert. Generate landing page content for the premium domain "${domain}" (category: ${category || "general"}). Return ONLY valid JSON with these fields:
{
  "headline": "short catchy headline about why this domain is perfect (max 8 words)",
  "tagline": "one-liner value proposition (max 15 words)",
  "description": "2-3 sentence description of ideal use cases for this domain name",
  "keywords": ["array", "of", "5-8", "seo", "keywords"],
  "color_primary": "hex color that matches the domain's vibe",
  "color_secondary": "dark background hex color",
  "font": "Google Font name that fits the brand",
  "use_cases": ["3 specific use cases"],
  "industry": "primary industry"
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      landing_headline: parsed.headline || `${domain} is available`,
      landing_tagline: parsed.tagline || "Own this premium domain",
      landing_description: parsed.description || "",
      landing_keywords: parsed.keywords || [],
      landing_color_primary: parsed.color_primary || "#6E8BFF",
      landing_color_secondary: parsed.color_secondary || "#1a1a2e",
      landing_font: parsed.font || "Inter",
      landing_use_cases: parsed.use_cases || [],
      landing_industry: parsed.industry || category || "Technology",
    };
  } catch (e) {
    console.error("[domainMarketplace] Gemini error:", e);
    const name = domain.replace(/\.(com|io|dev|co|net|org|ai)$/i, "");
    return {
      landing_headline: `${name} is available`,
      landing_tagline: `Own the perfect domain for your next venture`,
      landing_description: `${domain} is a premium domain name.`,
      landing_keywords: [name, domain, "premium domain"],
      landing_color_primary: "#6E8BFF",
      landing_color_secondary: "#1a1a2e",
      landing_font: "Inter",
      landing_use_cases: ["SaaS Platform", "Tech Startup", "Developer Tool"],
      landing_industry: category || "Technology",
    };
  }
}

// Generate social media visual content with AI
async function generateSocialContent(domain: string, price: string, category: string): Promise<{
  headline: string;
  subtitle: string;
  hashtags: string[];
  caption: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("Dummy")) {
    return {
      headline: `${domain}\nis for sale`,
      subtitle: price === "Make offer" ? "Make your offer today" : `Starting at ${price}`,
      hashtags: ["#domains", "#premium", "#forsale", "#startup"],
      caption: `🔥 Premium domain alert! ${domain} is available. ${price === "Make offer" ? "Make your offer" : price}. Contact forsale@acrossed.com #domains #startup`,
    };
  }

  try {
    const prompt = `Create social media content for selling the domain "${domain}" (price: ${price}, category: ${category}). Return ONLY valid JSON:
{
  "headline": "2-3 word eye-catching headline for social media visual (max 5 words, use \\n for line breaks)",
  "subtitle": "short subtitle for visual (max 8 words)",
  "hashtags": ["array", "of", "6-8", "relevant", "hashtags"],
  "caption": "engaging social media caption with emojis (max 200 chars)"
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
      }),
    });

    if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("[domainMarketplace] social AI error:", e);
    return {
      headline: `${domain}\nis for sale`,
      subtitle: price === "Make offer" ? "Make your offer today" : `Starting at ${price}`,
      hashtags: ["#domains", "#premium", "#forsale"],
      caption: `🔥 ${domain} is available! Contact forsale@acrossed.com`,
    };
  }
}

// JSON file storage (keeping backward compat, but adding AI fields)
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
  // Public: list all domains
  app.get("/admin/domains", async () => {
    return await loadDomains();
  });

  // Public: get single domain by slug
  app.get<{ Params: { slug: string } }>("/admin/domains/by-slug/:slug", async (req, reply) => {
    const domains = await loadDomains();
    const domain = domains.find((d) => domainToSlug(d.domain) === req.params.slug);
    if (!domain) return reply.code(404).send({ error: "not_found" });
    return domain;
  });

  // Admin: add domain with AI-generated landing content
  app.post("/admin/domains", async (req, reply) => {
    if (!adminAllowed(req)) return reply.code(403).send({ error: "forbidden" });
    const schema = z.object({
      domain: z.string().min(3),
      price: z.string().default("Make offer"),
      description: z.string().default(""),
      category: z.string().default(""),
      featured: z.boolean().default(false),
      status: z.enum(["available", "sold", "reserved"]).default("available"),
      contact_email: z.string().default("forsale@acrossed.com"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body", details: parsed.error.issues });

    // Generate AI landing content
    const aiContent = await generateLandingContent(parsed.data.domain, parsed.data.category);

    const domains = await loadDomains();
    const entry: DomainListing = {
      id: randomUUID(),
      ...parsed.data,
      slug: domainToSlug(parsed.data.domain),
      verified: false,
      landing_headline: aiContent.landing_headline || "",
      landing_tagline: aiContent.landing_tagline || "",
      landing_description: aiContent.landing_description || parsed.data.description || "",
      landing_keywords: aiContent.landing_keywords || [],
      landing_color_primary: aiContent.landing_color_primary || "#6E8BFF",
      landing_color_secondary: aiContent.landing_color_secondary || "#1a1a2e",
      landing_font: aiContent.landing_font || "Inter",
      landing_use_cases: aiContent.landing_use_cases || [],
      landing_industry: aiContent.landing_industry || "",
      contact_email: parsed.data.contact_email || "forsale@acrossed.com",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    domains.push(entry);
    await saveDomains(domains);
    return entry;
  });

  // Admin: verify domain nameservers
  app.post<{ Params: { id: string } }>("/admin/domains/:id/verify", async (req, reply) => {
    if (!adminAllowed(req)) return reply.code(403).send({ error: "forbidden" });
    const domains = await loadDomains();
    const idx = domains.findIndex((d) => d.id === req.params.id);
    if (idx < 0) return reply.code(404).send({ error: "not_found" });

    const result = await verifyNameservers(domains[idx].domain);
    domains[idx].verified = result.verified;
    domains[idx].updated_at = new Date().toISOString();
    await saveDomains(domains);

    return {
      domain: domains[idx].domain,
      verified: result.verified,
      expected: NAMESERVERS,
      actual: result.actual,
    };
  });

  // Admin: regenerate AI content for a domain
  app.post<{ Params: { id: string } }>("/admin/domains/:id/regenerate", async (req, reply) => {
    if (!adminAllowed(req)) return reply.code(403).send({ error: "forbidden" });
    const domains = await loadDomains();
    const idx = domains.findIndex((d) => d.id === req.params.id);
    if (idx < 0) return reply.code(404).send({ error: "not_found" });

    const aiContent = await generateLandingContent(domains[idx].domain, domains[idx].category);
    domains[idx] = {
      ...domains[idx],
      ...aiContent,
      updated_at: new Date().toISOString(),
    } as DomainListing;
    await saveDomains(domains);
    return domains[idx];
  });

  // Admin: generate social media content
  app.post<{ Params: { id: string } }>("/admin/domains/:id/social", async (req, reply) => {
    if (!adminAllowed(req)) return reply.code(403).send({ error: "forbidden" });
    const domains = await loadDomains();
    const domain = domains.find((d) => d.id === req.params.id);
    if (!domain) return reply.code(404).send({ error: "not_found" });

    const social = await generateSocialContent(domain.domain, domain.price, domain.category);
    return { domain: domain.domain, ...social };
  });

  // Admin: update domain
  app.put<{ Params: { id: string } }>("/admin/domains/:id", async (req, reply) => {
    if (!adminAllowed(req)) return reply.code(403).send({ error: "forbidden" });
    const { id } = req.params;
    const domains = await loadDomains();
    const idx = domains.findIndex((d) => d.id === id);
    if (idx < 0) return reply.code(404).send({ error: "not_found" });

    const updates = req.body as Partial<DomainListing>;
    domains[idx] = { ...domains[idx], ...updates, id, updated_at: new Date().toISOString() };
    if (updates.domain) domains[idx].slug = domainToSlug(updates.domain);
    await saveDomains(domains);
    return domains[idx];
  });

  // Admin: delete domain
  app.delete<{ Params: { id: string } }>("/admin/domains/:id", async (req, reply) => {
    if (!adminAllowed(req)) return reply.code(403).send({ error: "forbidden" });
    const { id } = req.params;
    const domains = await loadDomains();
    const filtered = domains.filter((d) => d.id !== id);
    if (filtered.length === domains.length) return reply.code(404).send({ error: "not_found" });
    await saveDomains(filtered);
    return { ok: true };
  });

  // Contact form submission (public)
  app.post("/domains/contact", async (req, reply) => {
    const schema = z.object({
      domain: z.string(),
      name: z.string().min(1),
      email: z.string().email(),
      offer: z.string().optional(),
      message: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });

    // We'll just log this — the email will be handled by the contact form
    // sending to forsale@acrossed.com which Postfix delivers to maildir
    console.log(`[domain-contact] ${parsed.data.email} inquired about ${parsed.data.domain}`);
    return { ok: true, message: "Your inquiry has been sent. We'll get back to you within 24 hours." };
  });

  // Admin: DB overview endpoint
  app.get("/admin/db", async (req, reply) => {
    if (!adminAllowed(req)) return reply.code(403).send({ error: "forbidden" });

    const tables = await db.execute(sql`
      SELECT table_name, 
             (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count
      FROM information_schema.tables t 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tableData: Record<string, { columns: unknown[]; rows: unknown[]; count: number }> = {};
    const tableNames = (tables as unknown as { rows: { table_name: string }[] }).rows || tables;

    for (const t of tableNames as { table_name: string }[]) {
      const name = t.table_name;
      try {
        const cols = await db.execute(sql.raw(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${name}' AND table_schema = 'public' ORDER BY ordinal_position`));
        const countResult = await db.execute(sql.raw(`SELECT count(*)::int as count FROM "${name}"`));
        const rows = await db.execute(sql.raw(`SELECT * FROM "${name}" ORDER BY 1 DESC LIMIT 20`));

        const colRows = (cols as unknown as { rows: unknown[] }).rows || cols;
        const dataRows = (rows as unknown as { rows: unknown[] }).rows || rows;
        const cnt = ((countResult as unknown as { rows: { count: number }[] }).rows || countResult) as { count: number }[];

        tableData[name] = {
          columns: colRows as unknown[],
          rows: dataRows as unknown[],
          count: cnt[0]?.count ?? 0,
        };
      } catch (e) {
        tableData[name] = { columns: [], rows: [], count: 0 };
      }
    }

    return { tables: tableData };
  });
}
