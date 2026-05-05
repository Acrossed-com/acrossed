// Blog routes — admin CRUD (gated by INTERNAL_SECRET + ADMIN_CLERK_USER_IDS) and
// public read endpoints + RSS feed. The public site renders posts directly from
// these endpoints, and search engines pick them up via the per-post sitemap.
import type { FastifyInstance } from "fastify";
import { db, schema } from "../db/index.js";
import { and, desc, eq, sql } from "drizzle-orm";
import { config } from "../config.js";
import { generateCoverSvg, svgToDataUrl } from "../lib/svgCover.js";
import { computeReadingTimeMin, excerptFromMarkdown, slugifyTitle } from "../lib/blogUtils.js";
import { generateHeroImage } from "../lib/blogImageGen.js";
import { getMediumPosts } from "../lib/mediumFeed.js";

const adminIds = new Set((process.env.ADMIN_CLERK_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean));
function adminOk(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const sec = req.headers["x-internal-secret"];
  const uid = req.headers["x-acting-clerk-user-id"];
  if (typeof sec !== "string" || sec !== config.INTERNAL_SECRET) return null;
  if (typeof uid !== "string" || !adminIds.has(uid)) return null;
  return uid;
}

interface PostBody {
  slug?: string;
  title: string;
  excerpt?: string;
  bodyMd?: string;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  tags?: string[];
  status?: "draft" | "published";
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]!));
}

export async function blogRoutes(app: FastifyInstance): Promise<void> {
  // ─── PUBLIC ──────────────────────────────────────────────────────────────
  // Lists published posts only, newest first. No auth.
  app.get("/blog/posts", async () => {
    const rows = await db.select({
      id: schema.blogPosts.id, slug: schema.blogPosts.slug, title: schema.blogPosts.title,
      excerpt: schema.blogPosts.excerpt, heroImageUrl: schema.blogPosts.heroImageUrl,
      heroImageAlt: schema.blogPosts.heroImageAlt, tags: schema.blogPosts.tags,
      publishedAt: schema.blogPosts.publishedAt, readingTimeMin: schema.blogPosts.readingTimeMin,
    }).from(schema.blogPosts)
      .where(eq(schema.blogPosts.status, "published"))
      .orderBy(desc(schema.blogPosts.publishedAt));
    return { posts: rows };
  });

  app.get<{ Params: { slug: string } }>("/blog/posts/:slug", async (req, reply) => {
    const [row] = await db.select().from(schema.blogPosts)
      .where(and(eq(schema.blogPosts.slug, req.params.slug), eq(schema.blogPosts.status, "published")));
    if (!row) return reply.code(404).send({ error: "not_found" });
    // bump view counter (best-effort, fire-and-forget)
    db.update(schema.blogPosts).set({ viewCount: sql`${schema.blogPosts.viewCount} + 1` })
      .where(eq(schema.blogPosts.id, row.id)).catch(() => {});
    return row;
  });

  app.get("/blog/medium", async () => ({ posts: await getMediumPosts() }));

  app.get("/blog/rss.xml", async (_req, reply) => {
    const posts = await db.select().from(schema.blogPosts)
      .where(eq(schema.blogPosts.status, "published"))
      .orderBy(desc(schema.blogPosts.publishedAt))
      .limit(50);
    const items = posts.map((p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>https://acrossed.com/blog/${p.slug}</link>
      <guid isPermaLink="true">https://acrossed.com/blog/${p.slug}</guid>
      <description>${escapeXml(p.excerpt || "")}</description>
      ${p.publishedAt ? `<pubDate>${p.publishedAt.toUTCString()}</pubDate>` : ""}
      ${(p.tags ?? []).map((t) => `<category>${escapeXml(t)}</category>`).join("")}
    </item>`).join("");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Acrossed — Blog</title>
    <link>https://acrossed.com/blog</link>
    <description>The cryptographic ALLOW/DENY layer for your apps. Notes from the team.</description>
    <language>en</language>
    <atom:link href="https://acrossed.com/blog/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
    reply.header("content-type", "application/rss+xml; charset=utf-8");
    return xml;
  });

  app.get("/blog/sitemap.xml", async (_req, reply) => {
    const posts = await db.select({ slug: schema.blogPosts.slug, updatedAt: schema.blogPosts.updatedAt, publishedAt: schema.blogPosts.publishedAt })
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.status, "published"));
    const urls = posts.map((p) => `
  <url>
    <loc>https://acrossed.com/blog/${p.slug}</loc>
    <lastmod>${(p.updatedAt ?? p.publishedAt ?? new Date()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`).join("");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
    reply.header("content-type", "application/xml; charset=utf-8");
    return xml;
  });

  // ─── ADMIN ───────────────────────────────────────────────────────────────
  app.get("/admin/blog/posts", async (req, reply) => {
    if (!adminOk(req)) return reply.code(403).send({ error: "forbidden" });
    const rows = await db.select().from(schema.blogPosts).orderBy(desc(schema.blogPosts.updatedAt));
    return { posts: rows };
  });

  app.get<{ Params: { id: string } }>("/admin/blog/posts/:id", async (req, reply) => {
    if (!adminOk(req)) return reply.code(403).send({ error: "forbidden" });
    const [row] = await db.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, req.params.id));
    if (!row) return reply.code(404).send({ error: "not_found" });
    return row;
  });

  app.post<{ Body: PostBody }>("/admin/blog/posts", async (req, reply) => {
    const uid = adminOk(req); if (!uid) return reply.code(403).send({ error: "forbidden" });
    const b = req.body ?? ({} as PostBody);
    if (!b.title || !b.title.trim()) return reply.code(400).send({ error: "title_required" });
    const slug = (b.slug && b.slug.trim()) || slugifyTitle(b.title) + "-" + Math.random().toString(36).slice(2, 6);
    const excerpt = (b.excerpt ?? "").trim() || excerptFromMarkdown(b.bodyMd ?? "");
    const reading = computeReadingTimeMin(b.bodyMd ?? "");
    const heroImageUrl = b.heroImageUrl ?? svgToDataUrl(generateCoverSvg(b.title));
    const heroImageAlt = b.heroImageAlt ?? `Cover for "${b.title}"`;
    try {
      const [row] = await db.insert(schema.blogPosts).values({
        slug, title: b.title.trim(), excerpt, bodyMd: b.bodyMd ?? "",
        heroImageUrl, heroImageAlt,
        seoTitle: b.seoTitle ?? null, seoDescription: b.seoDescription ?? null,
        seoKeywords: b.seoKeywords ?? [], tags: b.tags ?? [],
        status: b.status === "published" ? "published" : "draft",
        publishedAt: b.status === "published" ? new Date() : null,
        authorId: uid, readingTimeMin: reading,
      }).returning();
      return row;
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (msg.includes("blog_posts_slug")) return reply.code(409).send({ error: "slug_taken" });
      throw e;
    }
  });

  app.put<{ Params: { id: string }; Body: PostBody }>("/admin/blog/posts/:id", async (req, reply) => {
    if (!adminOk(req)) return reply.code(403).send({ error: "forbidden" });
    const b = req.body ?? ({} as PostBody);
    const [existing] = await db.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, req.params.id));
    if (!existing) return reply.code(404).send({ error: "not_found" });
    const reading = computeReadingTimeMin(b.bodyMd ?? existing.bodyMd);
    const newStatus = b.status ?? existing.status;
    const publishedAt = newStatus === "published" ? (existing.publishedAt ?? new Date()) : null;
    try {
      const [row] = await db.update(schema.blogPosts).set({
        slug: b.slug ?? existing.slug,
        title: b.title ?? existing.title,
        excerpt: b.excerpt ?? existing.excerpt,
        bodyMd: b.bodyMd ?? existing.bodyMd,
        heroImageUrl: b.heroImageUrl ?? existing.heroImageUrl,
        heroImageAlt: b.heroImageAlt ?? existing.heroImageAlt,
        seoTitle: b.seoTitle ?? existing.seoTitle,
        seoDescription: b.seoDescription ?? existing.seoDescription,
        seoKeywords: b.seoKeywords ?? existing.seoKeywords,
        tags: b.tags ?? existing.tags,
        status: newStatus,
        publishedAt,
        readingTimeMin: reading,
        updatedAt: new Date(),
      }).where(eq(schema.blogPosts.id, req.params.id)).returning();
      return row;
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (msg.includes("blog_posts_slug")) return reply.code(409).send({ error: "slug_taken" });
      throw e;
    }
  });

  app.delete<{ Params: { id: string } }>("/admin/blog/posts/:id", async (req, reply) => {
    if (!adminOk(req)) return reply.code(403).send({ error: "forbidden" });
    await db.delete(schema.blogPosts).where(eq(schema.blogPosts.id, req.params.id));
    return { ok: true };
  });

  // Auto cover (SVG, deterministic) or AI image if OPENAI_API_KEY is set.
  app.post<{ Body: { title: string; prompt?: string; mode?: "auto" | "ai" | "svg" } }>("/admin/blog/cover", async (req, reply) => {
    if (!adminOk(req)) return reply.code(403).send({ error: "forbidden" });
    const { title, prompt, mode } = req.body ?? ({ title: "Untitled" } as { title: string; prompt?: string; mode?: "auto" | "ai" | "svg" });
    if (mode === "svg" || (!process.env.OPENAI_API_KEY && mode !== "ai")) {
      const svg = generateCoverSvg(title || "Untitled");
      return { url: svgToDataUrl(svg), alt: `Cover for "${title}"`, source: "svg" as const };
    }
    return await generateHeroImage(title, prompt);
  });

  // Public, cacheable, real-URL SVG cover for OG/Twitter cards (avoids data: URLs in metadata).
  app.get<{ Querystring: { slug?: string; title?: string } }>(
    "/blog/cover.svg",
    async (req, reply) => {
      const slug = (req.query.slug || "").trim();
      let title = (req.query.title || "").trim();
      if (slug && !title) {
        const row = await db.query.blogPosts.findFirst({ where: (p, { eq }) => eq(p.slug, slug) });
        if (row) title = row.title;
      }
      if (!title) title = "Acrossed";
      const svg = generateCoverSvg(title);
      reply
        .header("content-type", "image/svg+xml; charset=utf-8")
        .header("cache-control", "public, max-age=300, s-maxage=600, stale-while-revalidate=86400")
        .send(svg);
    },
  );

}
