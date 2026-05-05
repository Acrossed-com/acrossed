import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";
export const revalidate = 60;

marked.setOptions({ gfm: true, breaks: false });
function sanitize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:\s*/gi, "");
}

interface Post {
  id: string; slug: string; title: string; excerpt: string; bodyMd: string;
  heroImageUrl: string | null; heroImageAlt: string | null;
  seoTitle: string | null; seoDescription: string | null;
  seoKeywords: string[] | null; tags: string[] | null;
  publishedAt: string; updatedAt: string; readingTimeMin: number; viewCount: number;
}

async function fetchPost(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`https://api.acrossed.com/blog/posts/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as Post;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: "Not found — Acrossed Blog" };
  const title = post.seoTitle ?? `${post.title} — Acrossed`;
  const description = post.seoDescription ?? post.excerpt;
  const url = `https://acrossed.com/blog/${post.slug}`;
  const ogImage = post.heroImageUrl && !post.heroImageUrl.startsWith("data:") ? post.heroImageUrl : undefined;
  return {
    title, description,
    keywords: post.seoKeywords ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article", url, title, description, siteName: "Acrossed",
      publishedTime: post.publishedAt, modifiedTime: post.updatedAt,
      tags: post.tags ?? undefined,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: post.heroImageAlt ?? post.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: ogImage ? [ogImage] : undefined },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  const html = sanitize(marked.parse(post.bodyMd ?? "", { async: false }) as string);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.heroImageUrl ? [post.heroImageUrl] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: [{ "@type": "Organization", name: "Acrossed", url: "https://acrossed.com" }],
    publisher: { "@type": "Organization", name: "Acrossed", logo: { "@type": "ImageObject", url: "https://acrossed.com/icon" } },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://acrossed.com/blog/${post.slug}` },
    keywords: (post.seoKeywords ?? post.tags ?? []).join(", "),
  };

  return (
    <>
      <Nav />
      <main className="pb-20 pt-16">
        <article className="mx-auto max-w-3xl space-y-8 px-6">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <Link href="/blog" className="font-mono text-xs uppercase tracking-widest text-ink-low hover:text-brand">← All posts</Link>
          <header className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(post.tags ?? []).map((t) => (
                <span key={t} className="font-mono rounded-full bg-bg-elev px-2 py-0.5 text-[10px] uppercase tracking-widest text-ink-low">#{t}</span>
              ))}
            </div>
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-5xl">{post.title}</h1>
            {post.excerpt && <p className="text-lg text-ink-mid">{post.excerpt}</p>}
            <p className="font-mono text-xs uppercase tracking-widest text-ink-low">
              {new Date(post.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} · {post.readingTimeMin} min read
            </p>
          </header>
          {post.heroImageUrl && (
            <img src={post.heroImageUrl} alt={post.heroImageAlt ?? post.title}
              className="aspect-[1200/630] w-full rounded-lg border border-line object-cover" />
          )}
          <div className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:tracking-tight prose-a:text-brand prose-code:rounded prose-code:bg-bg-elev prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em] prose-code:before:content-none prose-code:after:content-none"
            dangerouslySetInnerHTML={{ __html: html }} />
          <footer className="border-t border-line pt-8">
            <p className="text-sm text-ink-mid">
              Want to be notified when we publish? Follow us on{" "}
              <a href="https://medium.com/acrossed" target="_blank" rel="noopener" className="text-brand underline">Medium</a>
              {" "}or subscribe to our <a href="/blog/rss.xml" className="text-brand underline">RSS feed</a>.
            </p>
          </footer>
        </article>
      </main>
      <Footer />
    </>
  );
}
