export const dynamic = "force-dynamic";
export const revalidate = 300;
export async function GET() {
  const res = await fetch("https://api.acrossed.com/blog/rss.xml", { next: { revalidate: 300 } });
  const xml = await res.text();
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
