import Link from "next/link";
import { requireAdmin, getCurrentUserId } from "@/lib/admin";
import { internalFetch } from "@/lib/internalApi";

export const dynamic = "force-dynamic";

interface Post {
  id: string; slug: string; title: string; excerpt: string;
  status: "draft" | "published"; publishedAt: string | null;
  updatedAt: string; viewCount: number; readingTimeMin: number;
  tags: string[];
}

export default async function AdminBlogList() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    const userId = await getCurrentUserId();
    return (
      <div className="mx-auto max-w-xl space-y-4 py-12 text-center">
        <h1 className="font-display text-2xl font-semibold">Admin only</h1>
        {userId && <p className="font-mono text-xs text-ink-low">{userId}</p>}
        <Link href="/dashboard" className="btn btn-ghost mx-auto inline-flex">← Back</Link>
      </div>
    );
  }

  const data = await internalFetch<{ posts: Post[] }>("/admin/blog/posts", { actingUserId: isAdmin.userId });
  const drafts = data.posts.filter((p) => p.status === "draft");
  const published = data.posts.filter((p) => p.status === "published");

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Admin · Blog</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Posts</h1>
          <p className="mt-2 text-sm text-ink-mid">
            {published.length} published · {drafts.length} drafts. SEO meta, OG image, sitemap and RSS auto-generated on publish.
          </p>
        </div>
        <Link href="/dashboard/admin/blog/new" className="btn btn-primary">New post</Link>
      </header>

      {data.posts.length === 0 ? (
        <div className="surface p-10 text-center">
          <p className="text-ink-mid">No posts yet. <Link href="/dashboard/admin/blog/new" className="text-brand underline">Write the first one</Link>.</p>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          {data.posts.map((p, i) => (
            <Link key={p.id} href={`/dashboard/admin/blog/${p.id}/edit`}
              className={`block p-4 hover:bg-bg-elev transition-colors ${i > 0 ? "border-t border-line" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono rounded-full px-2 py-0.5 text-[9px] uppercase tracking-widest ${
                      p.status === "published" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                    }`}>{p.status}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink-low">/{p.slug}</span>
                  </div>
                  <p className="mt-1 font-medium text-ink-hi">{p.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-ink-mid">{p.excerpt}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink-low">
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "draft"}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-ink-low">{p.viewCount} views · {p.readingTimeMin}m read</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
