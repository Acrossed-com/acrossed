"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface BlogPostForm {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyMd: string;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  tags: string[];
  status: "draft" | "published";
}

const EMPTY: BlogPostForm = {
  slug: "", title: "", excerpt: "", bodyMd: "",
  heroImageUrl: null, heroImageAlt: null,
  seoTitle: null, seoDescription: null,
  seoKeywords: [], tags: [], status: "draft",
};

interface Props {
  initial?: BlogPostForm;
  onSave: (post: BlogPostForm) => Promise<{ ok: true; id: string; slug: string } | { ok: false; error: string }>;
  onDelete?: () => Promise<{ ok: true } | { ok: false; error: string }>;
  onGenerateCover: (title: string, mode: "svg" | "ai") => Promise<{ url: string; alt: string; source: "svg" | "ai" }>;
}

export function BlogEditor({ initial, onSave, onDelete, onGenerateCover }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [post, setPost] = useState<BlogPostForm>(initial ?? EMPTY);
  const [genPending, setGenPending] = useState<"svg" | "ai" | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<string>("");

  // Auto-generate slug from title for new posts
  useEffect(() => {
    if (!initial && post.title && !post.slug) {
      const auto = post.title.toLowerCase().normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "").slice(0, 80);
      setPost((p) => ({ ...p, slug: auto }));
    }
  }, [post.title, initial, post.slug]);

  function update<K extends keyof BlogPostForm>(k: K, v: BlogPostForm[K]) {
    setPost((p) => ({ ...p, [k]: v }));
  }

  function save(status: "draft" | "published") {
    setErr(null);
    startTransition(async () => {
      const r = await onSave({ ...post, status });
      if ("error" in r) setErr(r.error);
      else router.push("/dashboard/admin/blog");
    });
  }

  async function generateCover(mode: "svg" | "ai") {
    if (!post.title) { setErr("Add a title first"); return; }
    setGenPending(mode); setErr(null);
    try {
      const r = await onGenerateCover(post.title, mode);
      setPost((p) => ({ ...p, heroImageUrl: r.url, heroImageAlt: r.alt }));
    } catch (e) {
      setErr((e as Error).message);
    } finally { setGenPending(null); }
  }

  async function togglePreview() {
    if (!showPreview) {
      const res = await fetch("/api/markdown-preview", { method: "POST", body: JSON.stringify({ md: post.bodyMd }) });
      const { html } = await res.json();
      setPreview(html);
    }
    setShowPreview((s) => !s);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard/admin/blog" className="font-mono text-xs uppercase tracking-widest text-ink-mid hover:text-ink-hi">← All posts</Link>
        <div className="flex gap-2">
          {onDelete && (
            <button onClick={() => { if (confirm("Delete this post?")) startTransition(async () => { const r = await onDelete!(); if ("error" in r) setErr(r.error); else router.push("/dashboard/admin/blog"); }); }}
              disabled={pending}
              className="btn btn-ghost text-rose-400 hover:bg-rose-500/10">Delete</button>
          )}
          <button onClick={() => save("draft")} disabled={pending || !post.title} className="btn btn-ghost">Save draft</button>
          <button onClick={() => save("published")} disabled={pending || !post.title} className="btn btn-primary">{post.status === "published" ? "Update" : "Publish"}</button>
        </div>
      </div>

      {err && <div className="surface border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">{err}</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: editor */}
        <div className="space-y-4">
          <input value={post.title} onChange={(e) => update("title", e.target.value)}
            placeholder="Post title" className="surface w-full bg-transparent p-4 font-display text-2xl font-semibold tracking-tight text-ink-hi placeholder:text-ink-low focus:outline-none focus:ring-2 focus:ring-brand/40" />

          <input value={post.slug} onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            placeholder="url-slug-here" className="surface font-mono w-full bg-transparent p-3 text-sm text-ink-mid placeholder:text-ink-low focus:outline-none focus:ring-2 focus:ring-brand/40" />

          <textarea value={post.excerpt} onChange={(e) => update("excerpt", e.target.value)}
            placeholder="Excerpt — used for cards, social shares, RSS, search snippets. Auto-generated from body if left blank."
            rows={2}
            className="surface w-full resize-none bg-transparent p-3 text-sm text-ink-mid placeholder:text-ink-low focus:outline-none focus:ring-2 focus:ring-brand/40" />

          <div className="surface overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-line p-2">
              <span className="eyebrow ml-2">Body · Markdown</span>
              <button onClick={togglePreview} className="btn btn-ghost text-xs">{showPreview ? "Edit" : "Preview"}</button>
            </div>
            {showPreview ? (
              <div className="prose prose-invert max-w-none p-6" dangerouslySetInnerHTML={{ __html: preview }} />
            ) : (
              <textarea value={post.bodyMd} onChange={(e) => update("bodyMd", e.target.value)}
                placeholder={"# Your headline\n\nWrite in **markdown**.\n\n- Lists\n- Code: `inline` or fenced ```js\n\n> Quotes work too."}
                rows={24}
                className="font-mono w-full resize-y bg-transparent p-4 text-sm leading-relaxed text-ink-hi placeholder:text-ink-low focus:outline-none" />
            )}
          </div>
        </div>

        {/* Right: side panel */}
        <aside className="space-y-4">
          <div className="surface p-4">
            <p className="eyebrow mb-3">Cover image</p>
            {post.heroImageUrl ? (
              <img src={post.heroImageUrl} alt={post.heroImageAlt ?? ""} className="aspect-[1200/630] w-full rounded-md border border-line object-cover" />
            ) : (
              <div className="aspect-[1200/630] w-full rounded-md border border-dashed border-line bg-bg-elev p-4 text-center text-xs text-ink-mid">
                No cover. Click below to auto-generate.
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => generateCover("svg")} disabled={genPending !== null} className="btn btn-ghost text-xs">
                {genPending === "svg" ? "…" : "SVG cover"}
              </button>
              <button onClick={() => generateCover("ai")} disabled={genPending !== null} className="btn btn-ghost text-xs">
                {genPending === "ai" ? "…" : "AI cover"}
              </button>
            </div>
            <input value={post.heroImageUrl ?? ""} onChange={(e) => update("heroImageUrl", e.target.value || null)}
              placeholder="…or paste image URL"
              className="font-mono mt-2 w-full rounded-md border border-line bg-transparent p-2 text-xs text-ink-mid focus:outline-none focus:ring-1 focus:ring-brand/40" />
          </div>

          <div className="surface p-4 space-y-3">
            <p className="eyebrow">SEO</p>
            <input value={post.seoTitle ?? ""} onChange={(e) => update("seoTitle", e.target.value || null)}
              placeholder="SEO title (defaults to post title)"
              className="w-full rounded-md border border-line bg-transparent p-2 text-xs text-ink-hi focus:outline-none focus:ring-1 focus:ring-brand/40" />
            <textarea value={post.seoDescription ?? ""} onChange={(e) => update("seoDescription", e.target.value || null)}
              placeholder="SEO description (defaults to excerpt)" rows={3}
              className="w-full resize-none rounded-md border border-line bg-transparent p-2 text-xs text-ink-hi focus:outline-none focus:ring-1 focus:ring-brand/40" />
            <input value={post.seoKeywords.join(", ")} onChange={(e) => update("seoKeywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              placeholder="keyword1, keyword2"
              className="w-full rounded-md border border-line bg-transparent p-2 text-xs text-ink-mid focus:outline-none focus:ring-1 focus:ring-brand/40" />
          </div>

          <div className="surface p-4 space-y-3">
            <p className="eyebrow">Tags</p>
            <input value={post.tags.join(", ")} onChange={(e) => update("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              placeholder="security, webhooks, edge"
              className="w-full rounded-md border border-line bg-transparent p-2 text-xs text-ink-mid focus:outline-none focus:ring-1 focus:ring-brand/40" />
          </div>

          <p className="text-[11px] text-ink-low">
            Status: <span className="font-mono">{post.status}</span> · sitemap.xml, RSS and OG meta auto-update on publish.
          </p>
        </aside>
      </div>
    </div>
  );
}
