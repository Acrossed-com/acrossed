import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design System — Acrossed",
  description: "The Acrossed brand identity: colors, typography, logo usage, and design principles.",
};

/* ── Official Acrossed "A" mark (matches Nav.tsx Mark component) ── */
function AcrossedMark({ size = 24, color = "#ECEDEE" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.178} viewBox="0 0 1087.05 1280.28" fill="none" aria-hidden>
      <path fill={color} d="M0,1280.28h136.38l296.35-349h336.93l-79,349h106.55L1087.05,0Zm793.17-453h-272.21l371.2-437.2Z" />
    </svg>
  );
}

const COLORS = [
  { name: "Acrossed Blue", hex: "#6E8BFF", rgb: "110, 139, 255", use: "Primary brand color. Buttons, links, accents, badges." },
  { name: "Ink High", hex: "#ECEDEE", rgb: "236, 237, 238", use: "Primary text on dark backgrounds." },
  { name: "Ink Mid", hex: "#A1A1AA", rgb: "161, 161, 170", use: "Secondary text, descriptions, muted labels." },
  { name: "Ink Low", hex: "#71717A", rgb: "113, 113, 122", use: "Tertiary text, disabled states, timestamps." },
  { name: "Surface Base", hex: "#07090D", rgb: "7, 9, 13", use: "Primary dark background. Used across the entire site." },
  { name: "Surface Elevated", hex: "#0D1017", rgb: "13, 16, 23", use: "Elevated surfaces: cards, modals, popovers." },
  { name: "Line", hex: "rgba(255,255,255,0.07)", rgb: "—", use: "Default borders, dividers, separators." },
  { name: "Line Strong", hex: "rgba(255,255,255,0.12)", rgb: "—", use: "Hover borders, interactive edges." },
  { name: "Good (Allow)", hex: "#4ADE80", rgb: "74, 222, 128", use: "Success states, allow decisions, positive metrics." },
  { name: "Bad (Deny)", hex: "#EF6F6F", rgb: "239, 111, 111", use: "Error states, deny decisions, destructive actions." },
  { name: "Warn", hex: "#FBBF24", rgb: "251, 191, 36", use: "Warnings, caution alerts." },
];

const FONTS = [
  { name: "Cabinet Grotesk", use: "Display & Headlines", className: "font-display", example: "Decide before you serve.", note: "Used for all h1/h2 headings, hero text, and section titles. Semi-bold (600), tight tracking (-0.02em)." },
  { name: "Supreme", use: "Body Text", className: "", example: "An open decision layer that judges every request.", note: "Primary body font. Clean, geometric, professional yet distinctive. Regular (400), relaxed line-height (1.55)." },
  { name: "JetBrains Mono", use: "Code & Monospace", className: "font-mono", example: "const d = await acrossed.check(req);", note: "Used for code blocks, API keys, terminal commands, and mono-spaced UI (eyebrow labels, stats)." },
];

export default function DesignPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-16 sm:px-7 sm:pt-20">
        <p className="eyebrow mb-3">Brand & Design</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: "#ECEDEE" }}>
          Design System
        </h1>
        <p style={{ fontFamily: "'Supreme', sans-serif", fontSize: "1.0625rem", lineHeight: 1.55, color: "#A1A1AA", marginTop: 14, maxWidth: 600 }}>
          The complete Acrossed visual identity — colors, typography, logo usage, and design principles.
        </p>

        {/* Logo Section */}
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold tracking-tight" style={{ color: "#ECEDEE" }}>Logo</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {/* Dark background */}
            <div className="surface flex items-center justify-center p-10" style={{ background: "#07090d" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <AcrossedMark size={28} color="#ECEDEE" />
                <span className="font-display" style={{ fontSize: 22, fontWeight: 600, color: "#ECEDEE", letterSpacing: "-0.02em" }}>acrossed</span>
              </div>
            </div>
            {/* Light background */}
            <div className="surface flex items-center justify-center p-10" style={{ background: "#ECEDEE" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <AcrossedMark size={28} color="#07090d" />
                <span className="font-display" style={{ fontSize: 22, fontWeight: 600, color: "#07090d", letterSpacing: "-0.02em" }}>acrossed</span>
              </div>
            </div>
          </div>
          {/* Standalone mark */}
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <div className="surface flex flex-col items-center justify-center gap-2 p-6" style={{ background: "#07090d" }}>
              <AcrossedMark size={40} color="#ECEDEE" />
              <span className="font-mono text-[10px] text-ink-low">Mark — dark</span>
            </div>
            <div className="surface flex flex-col items-center justify-center gap-2 p-6" style={{ background: "#ECEDEE" }}>
              <AcrossedMark size={40} color="#07090d" />
              <span className="font-mono text-[10px]" style={{ color: "#71717A" }}>Mark — light</span>
            </div>
            <div className="surface flex flex-col items-center justify-center gap-2 p-6" style={{ background: "#07090d" }}>
              <AcrossedMark size={40} color="#6E8BFF" />
              <span className="font-mono text-[10px] text-ink-low">Mark — brand</span>
            </div>
            <div className="surface flex flex-col items-center justify-center gap-2 p-6" style={{ background: "linear-gradient(135deg, #0a0d14, #111827)" }}>
              <AcrossedMark size={40} color="#ECEDEE" />
              <span className="font-mono text-[10px] text-ink-low">Mark — gradient</span>
            </div>
          </div>
          <p className="mt-3" style={{ fontSize: 13, color: "#71717A", fontFamily: "'Supreme', sans-serif" }}>
            The Acrossed mark is a custom geometric &ldquo;A&rdquo; letterform. Always lowercase in wordmarks. Minimum clear space: 1× the mark height on all sides. Never stretch, rotate, or add effects.
          </p>
        </section>

        {/* Colors */}
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold tracking-tight" style={{ color: "#ECEDEE" }}>Colors</h2>
          <p className="mt-2" style={{ fontSize: 14, color: "#A1A1AA", fontFamily: "'Supreme', sans-serif" }}>
            Acrossed uses a dark-first palette. <strong style={{ color: "#6E8BFF" }}>Acrossed Blue (#6E8BFF)</strong> is the primary brand color.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COLORS.map((c) => (
              <div key={c.name} className="surface overflow-hidden">
                <div style={{ height: 56, background: c.hex }} />
                <div className="p-4">
                  <p className="font-display text-sm font-semibold" style={{ color: "#ECEDEE" }}>{c.name}</p>
                  <p className="font-mono mt-1 text-xs" style={{ color: "#A1A1AA" }}>{c.hex}</p>
                  <p className="mt-2 text-xs" style={{ color: "#71717A", fontFamily: "'Supreme', sans-serif", lineHeight: 1.45 }}>{c.use}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold tracking-tight" style={{ color: "#ECEDEE" }}>Typography</h2>
          <div className="mt-5 space-y-4">
            {FONTS.map((f) => (
              <div key={f.name} className="surface p-5">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-display text-sm font-semibold" style={{ color: "#ECEDEE" }}>{f.name}</span>
                  <span className="font-mono rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-widest" style={{ color: "#6E8BFF" }}>{f.use}</span>
                </div>
                <p className={`mt-3 text-2xl ${f.className}`} style={{ color: "#ECEDEE" }}>{f.example}</p>
                <p className="mt-2 text-xs" style={{ color: "#71717A", fontFamily: "'Supreme', sans-serif", lineHeight: 1.5 }}>{f.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Design Principles */}
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold tracking-tight" style={{ color: "#ECEDEE" }}>Design Principles</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              { title: "Dark by default", desc: "Every surface starts from #07090D. Light mode is not supported." },
              { title: "Cryptographically precise", desc: "UI elements are sharp, geometric, and deliberate. No rounded blob shapes or playful illustrations." },
              { title: "Monospace for data", desc: "Any value the user might copy (keys, IDs, stats) uses JetBrains Mono." },
              { title: "Acrossed Blue sparingly", desc: "#6E8BFF is reserved for interactive elements, CTAs, and brand highlights. Never use it for large background fills." },
            ].map((p) => (
              <div key={p.title} className="surface p-5">
                <p className="font-display text-sm font-semibold" style={{ color: "#ECEDEE" }}>{p.title}</p>
                <p className="mt-2 text-xs" style={{ color: "#A1A1AA", fontFamily: "'Supreme', sans-serif", lineHeight: 1.5 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
