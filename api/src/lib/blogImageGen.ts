// Hero image generator. Tries OpenAI DALL-E if OPENAI_API_KEY is set, otherwise
// falls back to a deterministic SVG cover branded for Acrossed. Always returns
// a usable URL (data: URL for SVG, https URL for AI).
import { generateCoverSvg, svgToDataUrl } from "./svgCover.js";

export interface ImageGenResult {
  url: string;
  alt: string;
  source: "ai" | "svg";
}

export async function generateHeroImage(title: string, prompt?: string): Promise<ImageGenResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const aiPrompt = (prompt ?? `Editorial cover image for an article titled "${title}". Modern, abstract, dark navy background with subtle indigo and cyan glow, geometric shapes, no text, suitable as a 1200x630 blog hero.`).slice(0, 1000);
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "dall-e-3", prompt: aiPrompt, size: "1792x1024", n: 1 }),
      });
      if (res.ok) {
        const data = (await res.json()) as { data?: Array<{ url?: string }> };
        const url = data.data?.[0]?.url;
        if (url) return { url, alt: `AI-generated cover for "${title}"`, source: "ai" };
      }
    } catch {
      // fall through to svg
    }
  }
  const svg = generateCoverSvg(title);
  return { url: svgToDataUrl(svg), alt: `Cover for "${title}"`, source: "svg" };
}
