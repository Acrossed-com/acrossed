"use client";
import { useState, useRef, useCallback, useEffect } from "react";

const SIZES = [
  { id: "ig-post", label: "Instagram Post", w: 1080, h: 1080 },
  { id: "ig-story", label: "Instagram Story", w: 1080, h: 1920 },
  { id: "pin", label: "Pinterest Pin", w: 1000, h: 1500 },
  { id: "x-post", label: "X Post", w: 1200, h: 675 },
  { id: "og", label: "OG Image", w: 1200, h: 630 },
  { id: "linkedin", label: "LinkedIn Post", w: 1200, h: 627 },
];

const TEMPLATES = [
  { id: "announcement", name: "Product Announcement", bg: "linear-gradient(135deg, #0a0d14 0%, #111827 50%, #0a0d14 100%)", textColor: "#ECEDEE", accent: "#6E8BFF", headline: "Introducing Acrossed v2.0", subtitle: "Sub-millisecond decisions at scale" },
  { id: "feature", name: "Feature Highlight", bg: "linear-gradient(135deg, #07090d 0%, #0f172a 50%, #07090d 100%)", textColor: "#ECEDEE", accent: "#4ADE80", headline: "Rate Limiting", subtitle: "Per-IP protection at engine speed" },
  { id: "stats", name: "Stats Showcase", bg: "linear-gradient(135deg, #0c0e18 0%, #1a1a2e 50%, #0c0e18 100%)", textColor: "#ECEDEE", accent: "#6E8BFF", headline: "< 1ms", subtitle: "Engine p50 latency" },
  { id: "dark-minimal", name: "Dark Minimal", bg: "#07090d", textColor: "#ECEDEE", accent: "#6E8BFF", headline: "Decide before you serve.", subtitle: "acrossed.com" },
  { id: "gradient-blue", name: "Blue Gradient", bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)", textColor: "#ECEDEE", accent: "#818cf8", headline: "Cryptographic Protection", subtitle: "AES-256-GCM encrypted rules" },
  { id: "code-dark", name: "Code Dark", bg: "linear-gradient(180deg, #0a0d12 0%, #111827 100%)", textColor: "#d4d4d8", accent: "#a78bfa", headline: "const decision = await acrossed.check(req);", subtitle: "One line to protect your app" },
];

// Official Acrossed "A" mark SVG path data (from Nav.tsx)
const MARK_PATH = "M0,1280.28h136.38l296.35-349h336.93l-79,349h106.55L1087.05,0Zm793.17-453h-272.21l371.2-437.2Z";

export default function SocialDesignPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(SIZES[0]);
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [headline, setHeadline] = useState(TEMPLATES[0].headline);
  const [subtitle, setSubtitle] = useState(TEMPLATES[0].subtitle);
  const [showLogo, setShowLogo] = useState(true);
  const [fontSize, setFontSize] = useState(72);
  const [subFontSize, setSubFontSize] = useState(28);

  const drawMark = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, markSize: number, color: string) => {
    // Draw the official Acrossed A-mark by scaling the SVG path (viewBox 1087.05 x 1280.28)
    ctx.save();
    const scale = markSize / 1280.28;
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const path = new Path2D(MARK_PATH);
    ctx.fillStyle = color;
    ctx.fill(path);
    ctx.restore();
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const previewScale = 0.4;
    canvas.width = size.w * previewScale;
    canvas.height = size.h * previewScale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(previewScale, previewScale);

    // Background
    if (template.bg.startsWith("linear-gradient")) {
      const colors = template.bg.match(/#[0-9a-fA-F]{6}/g) || ["#07090d", "#111827"];
      const grad = ctx.createLinearGradient(0, 0, size.w, size.h);
      colors.forEach((c: string, i: number) => grad.addColorStop(i / Math.max(colors.length - 1, 1), c));
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = template.bg;
    }
    ctx.fillRect(0, 0, size.w, size.h);

    // Subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    ctx.lineWidth = 1;
    for (let x = 0; x < size.w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size.h); ctx.stroke(); }
    for (let y = 0; y < size.h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size.w, y); ctx.stroke(); }

    // Accent glow
    const grd = ctx.createRadialGradient(size.w * 0.5, size.h * 0.3, 0, size.w * 0.5, size.h * 0.3, size.w * 0.5);
    grd.addColorStop(0, template.accent + "15");
    grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size.w, size.h);

    // Logo (official Acrossed A-mark)
    if (showLogo) {
      const markH = Math.min(size.w, size.h) * 0.06;
      const lx = size.w * 0.06;
      const ly = size.h * 0.05;
      drawMark(ctx, lx, ly, markH, template.textColor);
      // "acrossed" wordmark next to mark
      const markW = markH * (1087.05 / 1280.28);
      ctx.font = `600 ${markH * 0.55}px 'Cabinet Grotesk', 'Inter', sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = template.textColor;
      ctx.fillText("acrossed", lx + markW + markH * 0.3, ly + markH * 0.52);
    }

    // Headline
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = template.textColor;
    const headFontSize = fontSize * (size.w / 1080);
    ctx.font = `600 ${headFontSize}px 'Cabinet Grotesk', 'Inter', sans-serif`;
    const maxW = size.w * 0.82;
    const words = headline.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW) { lines.push(line); line = word; }
      else { line = test; }
    }
    if (line) lines.push(line);
    const textY = size.h * 0.45;
    const lineH = headFontSize * 1.15;
    lines.forEach((l, i) => { ctx.fillText(l, size.w * 0.06, textY + i * lineH); });

    // Subtitle
    const subY = textY + lines.length * lineH + headFontSize * 0.5;
    ctx.fillStyle = template.textColor + "99";
    const subFS = subFontSize * (size.w / 1080);
    ctx.font = `400 ${subFS}px 'Supreme', 'Inter', sans-serif`;
    ctx.fillText(subtitle, size.w * 0.06, subY);

    // Bottom bar
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(0, size.h - size.h * 0.08, size.w, size.h * 0.08);
    ctx.fillStyle = template.textColor + "60";
    ctx.font = `500 ${14 * (size.w / 1080)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = "left";
    ctx.fillText("acrossed.com", size.w * 0.06, size.h - size.h * 0.03);
    ctx.textAlign = "right";
    ctx.fillText("Sub-millisecond decisions", size.w * 0.94, size.h - size.h * 0.03);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [size, template, headline, subtitle, showLogo, fontSize, subFontSize, drawMark]);

  useEffect(() => { render(); }, [render]);

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Re-render at full resolution for export
    const origW = canvas.width;
    const origH = canvas.height;
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Render at 1:1 scale
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Background
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
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = template.textColor;
    const headFS = fontSize * (size.w / 1080);
    ctx.font = `600 ${headFS}px 'Cabinet Grotesk', 'Inter', sans-serif`;
    const maxW = size.w * 0.82;
    const words = headline.split(" "); const lines: string[] = []; let line = "";
    for (const word of words) { const test = line ? line + " " + word : word; if (ctx.measureText(test).width > maxW) { lines.push(line); line = word; } else { line = test; } }
    if (line) lines.push(line);
    const textY = size.h * 0.45; const lineH = headFS * 1.15;
    lines.forEach((l, i) => { ctx.fillText(l, size.w * 0.06, textY + i * lineH); });
    const subY = textY + lines.length * lineH + headFS * 0.5;
    ctx.fillStyle = template.textColor + "99"; const sFS = subFontSize * (size.w / 1080);
    ctx.font = `400 ${sFS}px 'Supreme', 'Inter', sans-serif`; ctx.fillText(subtitle, size.w * 0.06, subY);
    ctx.fillStyle = "rgba(255,255,255,0.04)"; ctx.fillRect(0, size.h - size.h * 0.08, size.w, size.h * 0.08);
    ctx.fillStyle = template.textColor + "60"; ctx.font = `500 ${14 * (size.w / 1080)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = "left"; ctx.fillText("acrossed.com", size.w * 0.06, size.h - size.h * 0.03);
    ctx.textAlign = "right"; ctx.fillText("Sub-millisecond decisions", size.w * 0.94, size.h - size.h * 0.03);

    const link = document.createElement("a");
    link.download = `acrossed-${size.id}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    canvas.width = origW; canvas.height = origH;
    render();
  };

  const applyTemplate = (t: typeof TEMPLATES[0]) => { setTemplate(t); setHeadline(t.headline); setSubtitle(t.subtitle); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Social Media Designer</h1>
        <p className="mt-1 text-sm text-ink-mid" style={{ fontFamily: "'Supreme', sans-serif" }}>
          Design branded posts for Instagram, Pinterest, X, and more. Uses the official Acrossed mark.
        </p>
      </div>
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
            <div className="mt-2 grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => applyTemplate(t)} className={`rounded-md border p-2 text-left text-xs transition ${template.id === t.id ? "border-brand bg-brand/10" : "border-line hover:border-line-strong"}`}>
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
            <label className="flex items-center gap-2 text-sm text-ink-mid cursor-pointer">
              <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} className="accent-[#6E8BFF]" />
              Show logo
            </label>
          </div>
          <button onClick={exportImage} className="btn btn-primary w-full justify-center">
            Export PNG ({size.w}x{size.h})
          </button>
        </div>
      </div>
    </div>
  );
}
