import { RiShieldLine as Shield, RiFlashlightLine as Zap, RiLockLine as Lock, RiServerLine as Server, RiGitBranchLine as GitBranch, RiTerminalLine as Terminal } from "@remixicon/react";
export function Problem() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <p className="mono text-xs uppercase tracking-widest text-white/40">The problem</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">
            Systems break because rules are scattered.
          </h2>
        </div>
        <p className="text-white/65 leading-relaxed">
          Every team writes the same checks over and over — IP allowlists in nginx,
          rate limits in middleware, country blocks in CDN, header validation in
          handlers. The rules drift. The latency adds up. The audit story is a mess.
        </p>
      </div>
    </section>
  );
}

export function Solution() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="glass glow-border rounded-2xl p-10 text-center">
        <p className="mono text-xs uppercase tracking-widest text-white/40">The solution</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">
          Acrossed centralizes and enforces rules <span className="text-cyan-300">instantly</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-white/65">
          One signed call. One deterministic answer. Rules compiled into memory at boot,
          AES-256 at rest, HMAC-SHA-256 on the wire.
        </p>
      </div>
    </section>
  );
}

const features = [
  { icon: Zap, title: "1–5ms decisions", body: "Hot path is pure in-memory. No DB calls, no network hops between rules." },
  { icon: Lock, title: "Cryptographic by default", body: "HMAC-SHA-256 on every request. AES-256 for rules and keys at rest." },
  { icon: Shield, title: "Fail-safe deny", body: "Missing headers, expired timestamps, tampered payloads — all rejected." },
  { icon: Server, title: "Stateless & horizontal", body: "Run one or run twenty. Rules hydrate at boot, decisions are pure functions." },
  { icon: GitBranch, title: "Explicit priorities", body: "Conflicts resolved deterministically by rule priority — never by accident." },
  { icon: Terminal, title: "Tiny embeddable SDK", body: "One npm install. Zero dependencies on the hot path." },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <p className="mono text-xs uppercase tracking-widest text-white/40">Features</p>
      <h2 className="mt-3 text-4xl font-semibold tracking-tight">Built like infra, priced like a tool.</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="glass rounded-xl p-6">
            <f.icon className="h-5 w-5 text-violet-300" />
            <h3 className="mt-4 text-lg font-medium">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { k: "01", t: "Request", d: "Client calls /check with a signed payload." },
    { k: "02", t: "Verify", d: "HMAC + timestamp window confirm authenticity." },
    { k: "03", t: "Evaluate", d: "Rules run in memory, sorted by priority." },
    { k: "04", t: "Allow / Deny", d: "Single deterministic answer with reason." },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-24">
      <p className="mono text-xs uppercase tracking-widest text-white/40">How it works</p>
      <h2 className="mt-3 text-4xl font-semibold tracking-tight">Four steps. Always the same.</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {steps.map((s) => (
          <div key={s.k} className="glass relative overflow-hidden rounded-xl p-6">
            <span className="mono absolute right-4 top-3 text-xs text-white/30">{s.k}</span>
            <h3 className="mt-2 text-lg font-medium">{s.t}</h3>
            <p className="mt-2 text-sm text-white/60">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-32 pt-12">
      <div className="glass glow-border rounded-2xl p-12 text-center">
        <h2 className="text-4xl font-semibold tracking-tight">Stop scattering rules across your stack.</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/65">
          Spin up a project, paste your rules, and get a sub-5ms decision endpoint.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <a href="/sign-up" className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90">
            Start free
          </a>
          <a href="/docs" className="rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/85 hover:bg-white/10">
            Read the docs
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-xs text-white/40 mono">
        <span>© {new Date().getFullYear()} Acrossed</span>
        <span>built for infra, not dashboards</span>
      </div>
    </footer>
  );
}
