import Link from "next/link";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog — Acrossed",
  description: "Engineering deep-dives, security breakdowns, and notes from the team building the cryptographic ALLOW/DENY layer for APIs.",
  alternates: {
    canonical: "https://acrossed.com/blog",
    types: { "application/rss+xml": "https://acrossed.com/blog/rss.xml" },
  },
  openGraph: {
    type: "website",
    url: "https://acrossed.com/blog",
    title: "Acrossed — Blog",
    description: "Engineering notes from the team behind Acrossed.",
    siteName: "Acrossed",
  },
  twitter: { card: "summary_large_image", title: "Acrossed — Blog", description: "Engineering notes from the team." },
};

interface Post {
  id: string; slug: string; title: string; excerpt: string;
  heroImageUrl: string | null; heroImageAlt: string | null;
  publishedAt: string; readingTimeMin: number; tags: string[];
}
interface MediumPost { title: string; url: string; publishedAt: string; excerpt: string }

async function fetchPosts(): Promise<Post[]> {
  try {
    const res = await fetch("https://api.acrossed.com/blog/posts", { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return ((await res.json()) as { posts: Post[] }).posts ?? [];
  } catch { return []; }
}
async function fetchMedium(): Promise<MediumPost[]> {
  try {
    const res = await fetch("https://api.acrossed.com/blog/medium", { next: { revalidate: 600 } });
    if (!res.ok) return [];
    return ((await res.json()) as { posts: MediumPost[] }).posts ?? [];
  } catch { return []; }
}

export default async function BlogIndex() {
  const [posts, medium] = await Promise.all([fetchPosts(), fetchMedium()]);
  return (
    <>
      <Nav />
      <main className="pb-20 pt-16">
        <div className="mx-auto max-w-5xl px-6 space-y-16">
          <header className="space-y-3 text-center">
            <p className="eyebrow">Blog</p>
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Notes from the engine room.</h1>
            <p className="mx-auto max-w-2xl text-ink-mid">
              Engineering deep-dives, security breakdowns, and the occasional opinion on how we build infrastructure that's invisible until it isn't.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs">
              <a href="/blog/rss.xml" className="font-mono uppercase tracking-widest text-ink-low hover:text-brand">RSS</a>
              <span className="text-ink-low">·</span>
              <a href="https://medium.com/acrossed" target="_blank" rel="noopener" className="font-mono uppercase tracking-widest text-ink-low hover:text-brand">Medium</a>
            </div>
          </header>

          {posts.length === 0 ? (
            <div className="surface mx-auto max-w-2xl p-10 text-center">
              <p className="text-ink-mid">First posts coming soon. Follow along on <a href="https://medium.com/acrossed" target="_blank" rel="noopener" className="text-brand underline">Medium</a> in the meantime.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`}
                  className="surface group flex flex-col overflow-hidden transition-all hover:border-brand/40">
                  {p.heroImageUrl && (
                    <div className="aspect-[1200/630] w-full overflow-hidden border-b border-line">
                      <img src={p.heroImageUrl} alt={p.heroImageAlt ?? p.title} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
                    </div>
                  )}
                  <div className="flex-1 space-y-3 p-6">
                    <div className="flex flex-wrap gap-2">
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} className="font-mono rounded-full bg-bg-elev px-2 py-0.5 text-[10px] uppercase tracking-widest text-ink-low">#{t}</span>
                      ))}
                    </div>
                    <h2 className="font-display text-xl font-semibold leading-snug tracking-tight text-ink-hi group-hover:text-brand">{p.title}</h2>
                    <p className="line-clamp-2 text-sm text-ink-mid">{p.excerpt}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink-low">
                      {new Date(p.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} · {p.readingTimeMin} min read
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {medium.length > 0 && (
            <section className="space-y-6">
              <header className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">From our Medium</p>
                  <h2 className="font-display mt-1 text-2xl font-semibold tracking-tight">Latest on medium.com/acrossed</h2>
                </div>
                <a href="https://medium.com/acrossed" target="_blank" rel="noopener" className="btn btn-ghost text-xs">All posts →</a>
              </header>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {medium.map((m) => (
                  <a key={m.url} href={m.url} target="_blank" rel="noopener" className="surface group block p-5 transition-all hover:border-brand/40">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink-low">Medium · {m.publishedAt ? new Date(m.publishedAt).toLocaleDateString() : ""}</p>
                    <h3 className="font-display mt-2 line-clamp-2 text-base font-semibold leading-snug text-ink-hi group-hover:text-brand">{m.title}</h3>
                    <p className="mt-2 line-clamp-3 text-xs text-ink-mid">{m.excerpt}</p>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
