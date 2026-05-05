// Tiny helpers for blog content used by the API.
// HTML rendering happens on the web side using `marked`; the API only handles
// derived fields (slug, reading time, excerpt) so we keep zero new deps here.

export function computeReadingTimeMin(text: string): number {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function slugifyTitle(title: string): string {
  return (title ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function excerptFromMarkdown(md: string, maxLen = 200): string {
  const stripped = (md ?? "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/[#>*_`-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length <= maxLen) return stripped;
  return stripped.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}
