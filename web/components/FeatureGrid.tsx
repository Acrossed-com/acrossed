"use client";
import { motion } from "framer-motion";
import { RiShieldLine as Shield, RiGlobalLine as Globe, RiFlashlightLine as Zap, RiLockLine as Lock, RiPulseLine as Activity, RiGitBranchLine as GitBranch } from "@remixicon/react";
const FEATURES = [
  {
    icon: Shield,
    title: "Cryptographic by default",
    body: "Every request is HMAC-SHA256 signed against the raw bytes — no replay, no impersonation, no JSON-canonicalisation gotchas.",
  },
  {
    icon: Zap,
    title: "Sub-millisecond decisions",
    body: "Rules live in memory. The hot path never touches Postgres. A hit on your blocklist resolves in 80 microseconds.",
  },
  {
    icon: Lock,
    title: "AES-256-GCM at rest",
    body: "Rules and signing secrets are encrypted with a 32-byte master key. Even with database access, an attacker sees opaque blobs.",
  },
  {
    icon: Globe,
    title: "Custom domains, free TLS",
    body: "Bring your own domain or use the default <project>.acrsd.dev. Caddy mints a Let's Encrypt cert on first request automatically.",
  },
  {
    icon: Activity,
    title: "Rate-limit anything",
    body: "Sliding-window counters keyed by IP, header, or both. Bounded memory, automatic eviction, no Redis required.",
  },
  {
    icon: GitBranch,
    title: "SDKs you can audit",
    body: "JavaScript, Python, and Go — each under 200 lines, zero dependencies, MIT licensed. The whole pipeline is yours to read.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="relative py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Built for production</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Every safety primitive your team will ask for, before they ask.
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-px rounded-3xl border border-white/10 bg-white/5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group relative overflow-hidden bg-zinc-950/40 p-8 backdrop-blur transition-colors hover:bg-zinc-900/60"
            >
              <div className="pointer-events-none absolute -inset-1 -z-10 bg-gradient-to-br from-emerald-500/0 via-cyan-500/0 to-emerald-500/0 opacity-0 transition-opacity duration-500 group-hover:from-emerald-500/10 group-hover:via-cyan-500/5 group-hover:opacity-100" />
              <f.icon className="h-6 w-6 text-emerald-300" strokeWidth={1.5} />
              <h3 className="mt-6 text-lg font-medium tracking-tight">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
