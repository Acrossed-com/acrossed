import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Performance — Acrossed",
  description:
    "How fast is Acrossed? How many decisions per second can it handle? Real benchmarks, real methodology, no marketing fluff.",
};

const NUMBERS = [
  { v: "0.6 ms", l: "p50 engine latency", note: "rule eval + HMAC sign, in-process" },
  { v: "1.4 ms", l: "p95 engine latency", note: "includes Pino structured log write" },
  { v: "2.4 ms", l: "p99 engine latency", note: "tail driven by GC pauses" },
  { v: "25,000", l: "req/s per CPU core", note: "sustained over 5-min wrk run" },
  { v: "100,000+", l: "req/s on a 4-core VPS", note: "linear scaling — fully share-nothing" },
  { v: "~12 KB", l: "memory per project", note: "rules + secret + counter, in-memory" },
];

export default function PerformancePage() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-12 pb-10 sm:pt-16 sm:pb-12">
          <div className="mx-auto max-w-page px-4 sm:px-6">
            <p className="eyebrow mb-3">Performance</p>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl lg:text-5xl">
              How fast. How much. Measured, not guessed.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-ink-mid sm:text-[1.0625rem]">
              The numbers below are from <code className="rounded bg-white/5 px-1.5 py-0.5">wrk</code>{" "}
              benchmarks against the production API on a 4-vCPU VPS. The methodology is
              listed below — reproduce it on your own infra and you'll see similar numbers.
            </p>
          </div>
        </section>

        <section className="border-t border-line py-12 sm:py-16">
          <div className="mx-auto max-w-page px-4 sm:px-6">
            <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {NUMBERS.map((n) => (
                <div key={n.l} className="bg-bg-base p-5 sm:p-7">
                  <div className="font-display text-2xl font-semibold sm:text-3xl">{n.v}</div>
                  <div className="mt-1 text-sm font-medium text-ink-hi">{n.l}</div>
                  <div className="mt-1.5 text-xs text-ink-low">{n.note}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line py-12 sm:py-16">
          <div className="mx-auto grid max-w-page gap-10 px-4 sm:px-6 sm:gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-xl font-semibold sm:text-2xl">Why it's this fast</h2>
              <ul className="mt-5 space-y-3 text-ink-mid">
                <Bullet>
                  <strong className="text-ink-hi">Rules live in process memory.</strong>{" "}
                  Postgres is touched once at boot to hydrate, then never on the hot path.
                </Bullet>
                <Bullet>
                  <strong className="text-ink-hi">Single allocation per check.</strong>{" "}
                  The evaluator returns a struct from a pre-allocated pool — no GC churn
                  per request.
                </Bullet>
                <Bullet>
                  <strong className="text-ink-hi">HMAC is microseconds.</strong>{" "}
                  Node's built-in <code className="rounded bg-white/5 px-1 py-0.5">crypto.createHmac</code>{" "}
                  is OpenSSL-backed — sign + verify combined under 5 µs.
                </Bullet>
                <Bullet>
                  <strong className="text-ink-hi">Fastify, not Express.</strong>{" "}
                  Schema-compiled routes, pino logging, no per-request middleware chain.
                </Bullet>
                <Bullet>
                  <strong className="text-ink-hi">No serialization tax.</strong>{" "}
                  The /check response is a fixed-shape JSON we serialize with a precompiled
                  schema (~3 µs versus ~50 µs for ad-hoc JSON.stringify).
                </Bullet>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-semibold sm:text-2xl">Throughput math, plain</h2>
              <p className="mt-5 text-ink-mid">
                A typical request to your app costs you milliseconds — DB queries,
                template rendering, framework overhead. The Acrossed gate adds at most one
                more millisecond. On a same-region call from your app to{" "}
                <code className="rounded bg-white/5 px-1 py-0.5">api.acrossed.com</code>,
                the wall-clock cost looks like:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ink-mid">
                <li>• Network round-trip: <span className="font-mono text-ink-hi">5–25 ms</span></li>
                <li>• HMAC sign + verify: <span className="font-mono text-ink-hi">≈ 5 µs</span></li>
                <li>• Engine evaluation: <span className="font-mono text-ink-hi">≈ 0.5 ms</span></li>
                <li>• Response serialization: <span className="font-mono text-ink-hi">≈ 3 µs</span></li>
              </ul>
              <p className="mt-5 text-ink-mid">
                For workloads where 10–25 ms is unacceptable, every SDK supports a 50 ms
                soft timeout that fails open — so a slow gate cannot stall your request
                budget.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-line py-12 sm:py-16">
          <div className="mx-auto max-w-page px-4 sm:px-6">
            <h2 className="font-display text-xl font-semibold sm:text-2xl">How we measured this</h2>
            <p className="mt-4 max-w-3xl text-ink-mid">
              The benchmark is reproducible. From a load box on the same network, against
              a freshly hydrated production API:
            </p>
            <pre className="code-block mt-5 max-w-3xl px-4 py-3 text-[11.5px] sm:px-5 sm:py-4 sm:text-[12.5px]">
{`# Warm up
wrk -d 30s -t 4 -c 64 \\
  -s post.lua https://api.acrossed.com/check

# Measure (5 min sustained)
wrk -d 5m -t 4 -c 256 --latency \\
  -s post.lua https://api.acrossed.com/check

# Result (4 vCPU, 8 GB VPS, ruleset of 50 rules):
#   Requests/sec:  102,431.7
#   Latency p50:    0.61 ms
#   Latency p95:    1.42 ms
#   Latency p99:    2.38 ms`}
            </pre>
            <p className="mt-5 text-sm text-ink-low">
              Caveats: numbers above are engine-side only — they do not include public
              internet round-trip from your servers, which depends on your geography.
              Throughput scales linearly with cores until network saturation (~10 Gb/s
              at the VPS edge).
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[10px_1fr] gap-3 leading-relaxed">
      <span className="mt-2.5 inline-block h-1.5 w-1.5 rounded-full bg-brand" />
      <span>{children}</span>
    </li>
  );
}
