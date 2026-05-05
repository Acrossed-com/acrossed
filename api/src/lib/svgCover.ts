// Auto-generated branded cover image for blog posts. Deterministic from title.
// Produces a 1200x630 OG-spec SVG with brand gradient + title overlay. Returned
// as a `data:image/svg+xml;base64,...` URL that can be embedded directly in <img>
// tags or <meta property="og:image">.
import { createHash } from "node:crypto";

const PALETTES: Array<[string, string, string]> = [
  ["#6E8BFF", "#3B5BDB", "#0d1017"], // indigo (brand)
  ["#5DD39E", "#2DA876", "#0d1017"], // mint
  ["#EF6F6F", "#C44141", "#0d1017"], // coral
  ["#F5C868", "#D49B2C", "#0d1017"], // amber
  ["#A78BFA", "#7C3AED", "#0d1017"], // purple
  ["#22D3EE", "#0E7490", "#0d1017"], // cyan
];

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]!));
}

function pickPalette(seed: string): [string, string, string] {
  const h = createHash("sha256").update(seed).digest();
  return PALETTES[h[0] % PALETTES.length];
}

function wrapTitle(title: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) { cur = w; continue; }
    if (cur.length + 1 + w.length <= maxCharsPerLine) cur += " " + w;
    else { lines.push(cur); cur = w; }
    if (lines.length >= maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, maxCharsPerLine - 1) + "…";
  }
  return lines;
}

export function generateCoverSvg(title: string, eyebrow = "Acrossed · Blog"): string {
  const [c1, c2, bg] = pickPalette(title);
  const lines = wrapTitle(title, 32, 4);
  const fontSize = lines.length > 2 ? 64 : 80;
  const lineHeight = fontSize * 1.15;
  const totalH = lines.length * lineHeight;
  const startY = 315 - totalH / 2 + fontSize * 0.85;
  const tspans = lines.map((l, i) => `<tspan x="80" y="${startY + i * lineHeight}">${escapeXml(l)}</tspan>`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${c2}" stop-opacity="0.10"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.75">
      <stop offset="0%" stop-color="${c1}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${c1}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${c1}" stroke-width="0.5" opacity="0.08"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="${bg}"/>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <text x="80" y="100" font-family="ui-sans-serif, system-ui, -apple-system" font-size="20" font-weight="600" letter-spacing="4" fill="${c1}" opacity="0.85">${escapeXml(eyebrow.toUpperCase())}</text>
  <text font-family="ui-sans-serif, system-ui, -apple-system" font-size="${fontSize}" font-weight="700" fill="#ECEDEE" letter-spacing="-1.5">${tspans}</text>
  <g transform="translate(80, 540)">
    <circle cx="12" cy="12" r="6" fill="${c1}"/>
    <text x="32" y="18" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="18" fill="#A1A1AA">acrossed.com/blog</text>
  </g>
</svg>`;
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}
