import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Changelog — Acrossed",
  description: "Every update to the Acrossed platform, engine, and SDKs.",
};

const ENTRIES = [
  {
    date: "2026-05-01",
    version: "v1.2",
    tag: "Engine",
    tagClass: "text-[#6E8BFF] border-[#6E8BFF]/30 bg-[#6E8BFF]/10",
    title: "Usage buffer flushing & improved quota accuracy",
    body: "Monthly decision counters now flush from the in-memory buffer to Postgres on a 30-second cadence rather than per-request. This reduces DB write pressure by ~95% at high throughput and keeps quota enforcement accurate to within one flush cycle.",
  },
  {
    date: "2026-05-01",
    version: "v1.2",
    tag: "API",
    tagClass: "text-[#44ffc6] border-[#44ffc6]/30 bg-[#44ffc6]/10",
    title: "Log sink: pause / resume + last-error surfacing",
    body: "BYO Postgres log sinks can now be paused and resumed from the dashboard without removing the connection. The last write error and timestamp are surfaced in the project UI so you know immediately if your DB is unhealthy.",
  },
  {
    date: "2026-04-28",
    version: "v1.1",
    tag: "Dashboard",
    tagClass: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    title: "Custom domain management in project view",
    body: "Pro and Enterprise projects can now add and remove custom domains directly from the project dashboard. CNAME instructions are shown inline. TLS is provisioned automatically on first HTTPS request via Caddy on-demand.",
  },
  {
    date: "2026-04-22",
    version: "v1.1",
    tag: "SDK",
    tagClass: "text-purple-400 border-purple-400/30 bg-purple-400/10",
    title: "Python SDK: fail-closed and timeout options",
    body: "The Python SDK now accepts fail_closed=True and timeout_ms parameters, matching the JS and Go SDKs. Defaults remain fail-open with a 5000 ms timeout.",
  },
  {
    date: "2026-04-15",
    version: "v1.0",
    tag: "Platform",
    tagClass: "text-pink-400 border-pink-400/30 bg-pink-400/10",
    title: "Public launch",
    body: "Acrossed is live. Free tier with 10,000 decisions/month. JS, Python, and Go SDKs. Rule engine with IP blocking, geo blocking, rate limiting, header enforcement, and time windows. AES-256-GCM rule storage, HMAC-SHA256 signed responses.",
  },
];

export default function ChangelogPage() {
  return (
    <>
      <Nav />
      <main className="pt-12 pb-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="eyebrow mb-3">Changelog</p>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">
            What&apos;s shipped.
          </h1>
          <p className="mt-4 text-ink-mid">
            Every meaningful change to the engine, API, SDKs, and dashboard — in reverse
            chronological order.
          </p>

          <div className="mt-14">
            {ENTRIES.map((e, i) => (
              <div key={i} className="grid grid-cols-[20px_1fr] gap-6">
                <div className="flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full border-2 border-brand bg-bg-base mt-1 shrink-0" />
                  {i < ENTRIES.length - 1 && (
                    <div className="flex-1 w-px bg-line mt-2" />
                  )}
                </div>
                <div className="pb-12">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="font-mono text-xs text-ink-low">{e.date}</span>
                    <span className="font-mono text-xs text-ink-low">·</span>
                    <span className="font-mono text-xs text-brand">{e.version}</span>
                    <span
                      className={`font-mono rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${e.tagClass}`}
                    >
                      {e.tag}
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-semibold text-ink-hi">
                    {e.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-mid">{e.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
