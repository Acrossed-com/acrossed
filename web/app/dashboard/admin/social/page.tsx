"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface Domain {
  id: string;
  domain: string;
  slug: string;
  price: string;
  category: string;
  landing_headline: string;
  landing_tagline: string;
  landing_color_primary: string;
  status: string;
}

interface SocialContent {
  domain: string;
  headline: string;
  subtitle: string;
  hashtags: string[];
  caption: string;
}

const SIZES = [
  { id: "ig-square", label: "Instagram", w: 1080, h: 1080 },
  { id: "ig-story", label: "Story", w: 1080, h: 1920 },
  { id: "x-post", label: "X / Twitter", w: 1200, h: 675 },
  { id: "pin", label: "Pinterest", w: 1000, h: 1500 },
  { id: "fb", label: "Facebook", w: 1200, h: 630 },
  { id: "linkedin", label: "LinkedIn", w: 1200, h: 627 },
];

const TEMPLATES = [
  { id: "dark", name: "Dark", bg: "linear-gradient(135deg, #07090d, #111827)", accent: "#6E8BFF", textColor: "#ECEDEE" },
  { id: "midnight", name: "Midnight Blue", bg: "linear-gradient(135deg, #0a1628, #1a2744)", accent: "#4FC3F7", textColor: "#ECEDEE" },
  { id: "ember", name: "Ember", bg: "linear-gradient(135deg, #1a0a0a, #2d1515)", accent: "#FF6B6B", textColor: "#ECEDEE" },
  { id: "aurora", name: "Aurora", bg: "linear-gradient(135deg, #0a1a0a, #152d15)", accent: "#4ADE80", textColor: "#ECEDEE" },
  { id: "royal", name: "Royal", bg: "linear-gradient(135deg, #1a0a2d, #2d1544)", accent: "#A78BFA", textColor: "#ECEDEE" },
  { id: "sunset", name: "Sunset", bg: "linear-gradient(135deg, #1a1005, #2d1a0a)", accent: "#FBBF24", textColor: "#ECEDEE" },
];

export default function AdminSocialPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [aiContent, setAiContent] = useState<SocialContent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [size, setSize] = useState(SIZES[0]);
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [headline, setHeadline] = useState("Your next big idea\nstarts here");
  const [subtitle, setSubtitle] = useState("Premium domains by Acrossed");
  const [fontSize, setFontSize] = useState(72);
  const [subFontSize, setSubFontSize] = useState(24);
  const [showLogo, setShowLogo] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch("/dashboard/api/admin/domains").then((r) => r.json()).then(setDomains).catch(() => {});
  }, []);

  const generateAI = async (domain: Domain) => {
    setGenerating(true);
    setSelectedDomain(domain);
    try {
      const res = await fetch(`/dashboard/api/admin/domains/${domain.id}/social`, { method: "POST" });
      if (res.ok) {
        const data: SocialContent = await res.json();
        setAiContent(data);
        setHeadline(data.headline);
        setSubtitle(data.subtitle);
        // Auto-pick a template accent color based on domain's landing color
        const domainColor = domain.landing_color_primary || "#6E8BFF";
        const matchingTemplate = TEMPLATES.find((t) => t.accent === domainColor) || TEMPLATES[0];
        setTemplate({ ...matchingTemplate, accent: domainColor });
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  const drawMark = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, h: number, color: string) => {
    const aspect = 1087.05 / 1280.28;
    const w = h * aspect;
    ctx.save();
    ctx.translate(x, y);
    const scale = h / 1280.28;
    ctx.scale(scale, scale);
    const p = new Path2D("M503.77 0.120117L507.08 6.73012L1047.08 1001.27L1087.05 1280.28L543.52 629.71L0 1280.28L39.97 1001.27L503.77 0.120117Z");
    ctx.fillStyle = color;
    ctx.fill(p);
    ctx.restore();
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const displayW = Math.min(size.w, 540);
    const scaleFactor = displayW / size.w;
    canvas.width = displayW;
    canvas.height = size.h * scaleFactor;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scaleFactor, scaleFactor);

    // Background
    if (template.bg.startsWith("linear-gradient")) {
      const colors = template.bg.match(/#[0-9a-fA-F]{6}/g) || ["#07090d", "#111827"];
      const grad = ctx.createLinearGradient(0, 0, size.w, size.h);
      colors.forEach((c, i) => grad.addColorStop(i / Math.max(colors.length - 1, 1), c));
      ctx.fillStyle = grad;
    } else { ctx.fillStyle = template.bg; }
    ctx.fillRect(0, 0, size.w, size.h);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.02)"; ctx.lineWidth = 1;
    for (let x = 0; x < size.w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size.h); ctx.stroke(); }
    for (let y = 0; y < size.h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size.w, y); ctx.stroke(); }

    // Glow
    const grd = ctx.createRadialGradient(size.w * 0.5, size.h * 0.3, 0, size.w * 0.5, size.h * 0.3, size.w * 0.5);
    grd.addColorStop(0, template.accent + "15"); grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, size.w, size.h);

    // Logo
    if (showLogo) {
      const markH = Math.min(size.w, size.h) * 0.06;
      drawMark(ctx, size.w * 0.06, size.h * 0.05, markH, template.textColor);
      const markW = markH * (1087.05 / 1280.28);
      ctx.font = `600 ${markH * 0.55}px 'Cabinet Grotesk', 'Inter', sans-serif`;
      ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = template.textColor;
      ctx.fillText("acrossed", size.w * 0.06 + markW + markH * 0.3, size.h * 0.05 + markH * 0.52);
    }

    // Domain name (big, accent color)
    if (selectedDomain) {
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = template.accent;
      const domFS = Math.min(fontSize * 0.5, 40) * (size.w / 1080);
      ctx.font = `700 ${domFS}px 'JetBrains Mono', monospace`;
      ctx.fillText(selectedDomain.domain, size.w * 0.06, size.h * 0.3);
    }

    // Headline
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = template.textColor;
    const headFS = fontSize * (size.w / 1080);
    ctx.font = `600 ${headFS}px 'Cabinet Grotesk', 'Inter', sans-serif`;
    const maxW = size.w * 0.82;
    const headText = headline.replace(/\\n/g, "\n");
    const rawLines = headText.split("\n");
    const lines: string[] = [];
    for (const rawLine of rawLines) {
      const words = rawLine.split(" "); let line = "";
      for (const word of words) { const test = line ? line + " " + word : word; if (ctx.measureText(test).width > maxW) { lines.push(line); line = word; } else { line = test; } }
      if (line) lines.push(line);
    }
    const textY = selectedDomain ? size.h * 0.42 : size.h * 0.45;
    const lineH = headFS * 1.15;
    lines.forEach((l, i) => { ctx.fillText(l, size.w * 0.06, textY + i * lineH); });

    // Subtitle
    const subY = textY + lines.length * lineH + headFS * 0.5;
    ctx.fillStyle = template.textColor + "99";
    const sFS = subFontSize * (size.w / 1080);
    ctx.font = `400 ${sFS}px 'Supreme', 'Inter', sans-serif`;
    ctx.fillText(subtitle, size.w * 0.06, subY);

    // Price badge
    if (showPrice && selectedDomain && selectedDomain.price) {
      const priceY = subY + sFS * 2;
      const priceText = selectedDomain.price;
      const priceFS = 28 * (size.w / 1080);
      ctx.font = `700 ${priceFS}px 'Cabinet Grotesk', 'Inter', sans-serif`;
      const priceW = ctx.measureText(priceText).width;
      const padX = 20 * (size.w / 1080);
      const padY = 12 * (size.w / 1080);
      ctx.fillStyle = template.accent + "15";
      ctx.strokeStyle = template.accent + "40";
      ctx.lineWidth = 1.5;
      const rx = size.w * 0.06;
      const rw = priceW + padX * 2;
      const rh = priceFS + padY * 2;
      const ry = priceY - priceFS - padY + 4;
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 10 * (size.w / 1080));
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = template.accent;
      ctx.fillText(priceText, rx + padX, priceY);
    }

    // Footer bar
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(0, size.h - size.h * 0.08, size.w, size.h * 0.08);
    ctx.fillStyle = template.textColor + "60";
    ctx.font = `500 ${14 * (size.w / 1080)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = "left"; ctx.fillText("acrossed.com", size.w * 0.06, size.h - size.h * 0.03);
    ctx.textAlign = "right"; ctx.fillText("Premium Domains", size.w * 0.94, size.h - size.h * 0.03);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [size, template, headline, subtitle, showLogo, showPrice, fontSize, subFontSize, drawMark, selectedDomain]);

  useEffect(() => { render(); }, [render]);

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const origW = canvas.width;
    const origH = canvas.height;
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Re-render at full resolution (same logic as render but without scale)
    if (template.bg.startsWith("linear-gradient")) {
      const colors = template.bg.match(/#[0-9a-fA-F]{6}/g) || ["#07090d", "#111827"];
      const grad = ctx.createLinearGradient(0, 0, size.w, size.h);
      colors.forEach((c, i) => grad.addColorStop(i / Math.max(colors.length - 1, 1), c));
      ctx.fillStyle = grad;
    } else { ctx.fillStyle = template.bg; }
    ctx.fillRect(0, 0, size.w, size.h);
    ctx.strokeStyle = "rgba(255,255,255,0.02)"; ctx.lineWidth = 1;
    for (let x = 0; x < size.w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size.h); ctx.stroke(); }
    for (let y = 0; y < size.h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size.w, y); ctx.stroke(); }
    const grd = ctx.createRadialGradient(size.w * 0.5, size.h * 0.3, 0, size.w * 0.5, size.h * 0.3, size.w * 0.5);
    grd.addColorStop(0, template.accent + "15"); grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, size.w, size.h);
    if (showLogo) {
      const markH = Math.min(size.w, size.h) * 0.06;
      drawMark(ctx, size.w * 0.06, size.h * 0.05, markH, template.textColor);
      const markW = markH * (1087.05 / 1280.28);
      ctx.font = `600 ${markH * 0.55}px 'Cabinet Grotesk', 'Inter', sans-serif`;
      ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = template.textColor;
      ctx.fillText("acrossed", size.w * 0.06 + markW + markH * 0.3, size.h * 0.05 + markH * 0.52);
    }
    if (selectedDomain) {
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = template.accent;
      const domFS = Math.min(fontSize * 0.5, 40) * (size.w / 1080);
      ctx.font = `700 ${domFS}px 'JetBrains Mono', monospace`;
      ctx.fillText(selectedDomain.domain, size.w * 0.06, size.h * 0.3);
    }
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = template.textColor;
    const headFS = fontSize * (size.w / 1080);
    ctx.font = `600 ${headFS}px 'Cabinet Grotesk', 'Inter', sans-serif`;
    const maxW = size.w * 0.82;
    const headText = headline.replace(/\\n/g, "\n");
    const rawLines = headText.split("\n");
    const lines: string[] = [];
    for (const rawLine of rawLines) {
      const words = rawLine.split(" "); let line = "";
      for (const word of words) { const test = line ? line + " " + word : word; if (ctx.measureText(test).width > maxW) { lines.push(line); line = word; } else { line = test; } }
      if (line) lines.push(line);
    }
    const textY = selectedDomain ? size.h * 0.42 : size.h * 0.45;
    const lineH = headFS * 1.15;
    lines.forEach((l, i) => { ctx.fillText(l, size.w * 0.06, textY + i * lineH); });
    const subY = textY + lines.length * lineH + headFS * 0.5;
    ctx.fillStyle = template.textColor + "99";
    const sFS = subFontSize * (size.w / 1080);
    ctx.font = `400 ${sFS}px 'Supreme', 'Inter', sans-serif`;
    ctx.fillText(subtitle, size.w * 0.06, subY);
    if (showPrice && selectedDomain && selectedDomain.price) {
      const priceY = subY + sFS * 2;
      const priceFS = 28 * (size.w / 1080);
      ctx.font = `700 ${priceFS}px 'Cabinet Grotesk', 'Inter', sans-serif`;
      const priceW = ctx.measureText(selectedDomain.price).width;
      const padX = 20 * (size.w / 1080);
      const padY = 12 * (size.w / 1080);
      ctx.fillStyle = template.accent + "15";
      ctx.strokeStyle = template.accent + "40";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(size.w * 0.06, priceY - priceFS - padY + 4, priceW + padX * 2, priceFS + padY * 2, 10 * (size.w / 1080));
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = template.accent;
      ctx.fillText(selectedDomain.price, size.w * 0.06 + padX, priceY);
    }
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(0, size.h - size.h * 0.08, size.w, size.h * 0.08);
    ctx.fillStyle = template.textColor + "60";
    ctx.font = `500 ${14 * (size.w / 1080)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = "left"; ctx.fillText("acrossed.com", size.w * 0.06, size.h - size.h * 0.03);
    ctx.textAlign = "right"; ctx.fillText("Premium Domains", size.w * 0.94, size.h - size.h * 0.03);

    const link = document.createElement("a");
    link.download = `acrossed-${selectedDomain?.domain || "social"}-${size.id}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    canvas.width = origW; canvas.height = origH;
    render();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">Admin · Social</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Social Media Designer</h1>
        <p className="mt-1 text-sm text-ink-mid" style={{ fontFamily: "'Supreme', sans-serif" }}>
          Select a domain, AI generates the content, then export a branded visual for any social platform.
        </p>
      </div>

      {/* Domain selector */}
      <div className="surface p-4">
        <p className="font-display text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#6E8BFF" }}>Select Domain</p>
        {domains.length === 0 ? (
          <p className="text-sm text-ink-low">No domains yet. Add domains in Admin → Domains first.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {domains.filter((d) => d.status === "available").map((d) => (
              <button
                key={d.id}
                onClick={() => generateAI(d)}
                disabled={generating}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  selectedDomain?.id === d.id
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-line text-ink-mid hover:border-line-strong hover:text-ink-hi"
                }`}
              >
                {d.domain}
                <span className="ml-2 font-mono text-[10px] text-ink-low">{d.price}</span>
              </button>
            ))}
          </div>
        )}
        {generating && (
          <p className="mt-2 text-xs text-brand animate-pulse">⚡ AI is generating content...</p>
        )}
      </div>

      {/* AI Content + Caption */}
      {aiContent && (
        <div className="surface p-4 space-y-3">
          <p className="font-display text-xs font-semibold uppercase tracking-widest" style={{ color: "#6E8BFF" }}>AI-Generated Content</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-low">Caption (click to copy)</label>
              <textarea
                readOnly
                value={aiContent.caption}
                rows={3}
                className="mt-1 w-full rounded-lg border border-line bg-bg-elev px-3 py-2 text-sm text-ink-hi cursor-pointer"
                onClick={(e) => { (e.target as HTMLTextAreaElement).select(); navigator.clipboard.writeText(aiContent.caption); }}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-low">Hashtags (click to copy)</label>
              <div
                className="mt-1 rounded-lg border border-line bg-bg-elev px-3 py-2 text-sm text-brand cursor-pointer"
                onClick={() => navigator.clipboard.writeText(aiContent.hashtags.join(" "))}
              >
                {aiContent.hashtags.join(" ")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas + Controls */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="surface flex items-center justify-center overflow-hidden p-4" style={{ minHeight: 400 }}>
          <canvas ref={canvasRef} style={{ maxWidth: "100%", maxHeight: 500, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }} />
        </div>
        <div className="space-y-4">
          <div className="surface p-4">
            <p className="font-display text-xs font-semibold uppercase tracking-widest" style={{ color: "#6E8BFF" }}>Size</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button key={s.id} onClick={() => setSize(s)} className={`rounded-md border px-2.5 py-1.5 text-xs transition ${size.id === s.id ? "border-brand bg-brand/10 text-brand" : "border-line text-ink-mid hover:border-line-strong"}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <p className="font-mono mt-2 text-[10px] text-ink-low">{size.w} x {size.h}px</p>
          </div>
          <div className="surface p-4">
            <p className="font-display text-xs font-semibold uppercase tracking-widest" style={{ color: "#6E8BFF" }}>Template</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setTemplate(t)} className={`rounded-md border p-2 text-left text-xs transition ${template.id === t.id ? "border-brand bg-brand/10" : "border-line hover:border-line-strong"}`}>
                  <div className="h-6 w-full rounded" style={{ background: t.bg }} />
                  <p className="mt-1 text-ink-hi" style={{ fontSize: 10 }}>{t.name}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="surface space-y-3 p-4">
            <p className="font-display text-xs font-semibold uppercase tracking-widest" style={{ color: "#6E8BFF" }}>Content</p>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-low">Headline</label>
              <textarea value={headline} onChange={(e) => setHeadline(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-line bg-bg-elev px-3 py-2 text-sm text-ink-hi outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-low">Subtitle</label>
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-bg-elev px-3 py-2 text-sm text-ink-hi outline-none focus:border-brand" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink-low">Headline size</label>
                <input type="range" min={32} max={120} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="mt-1 w-full accent-[#6E8BFF]" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink-low">Subtitle size</label>
                <input type="range" min={14} max={48} value={subFontSize} onChange={(e) => setSubFontSize(Number(e.target.value))} className="mt-1 w-full accent-[#6E8BFF]" />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-ink-mid cursor-pointer">
                <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} className="accent-[#6E8BFF]" />
                Logo
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-mid cursor-pointer">
                <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="accent-[#6E8BFF]" />
                Price badge
              </label>
            </div>
          </div>
          <button onClick={exportImage} className="btn btn-primary w-full justify-center">
            Export PNG ({size.w}x{size.h})
          </button>
        </div>
      </div>
    </div>
  );
}
