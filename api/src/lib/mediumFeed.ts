const FEED_URL = "https://medium.com/feed/@acrossed";
const TTL_MS = 10 * 60 * 1000;

export interface MediumPost {
  title: string;
  url: string;
  publishedAt: string;
  excerpt: string;
}

let cache: { at: number; posts: MediumPost[] } | null = null;

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function pluck(item: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = item.match(re);
  if (!m) return "";
  let v = m[1].trim();
  v = v.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
  return v;
}

export async function getMediumPosts(): Promise<MediumPost[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.posts;
  try {
    const res = await fetch(FEED_URL, { headers: { "user-agent": "acrossed-blog/1.0" } });
    if (!res.ok) throw new Error(`feed ${res.status}`);
    const xml = await res.text();
    const items = xml.split(/<item>/).slice(1).map((s) => s.split(/<\/item>/)[0] ?? "");
    const posts: MediumPost[] = items.slice(0, 6).map((item) => ({
      title: stripHtml(pluck(item, "title")) || "Untitled",
      url: stripHtml(pluck(item, "link")) || "https://medium.com/@acrossed",
      publishedAt: pluck(item, "pubDate") || "",
      excerpt: stripHtml(pluck(item, "description") || pluck(item, "content:encoded")).slice(0, 220),
    }));
    cache = { at: Date.now(), posts };
    return posts;
  } catch (err) {
    console.warn("medium_feed_fetch_failed", (err as Error).message);
    return cache?.posts ?? [];
  }
}
