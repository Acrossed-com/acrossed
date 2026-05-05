import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CodeShowcase } from "@/components/CodeShowcase";

export const metadata: Metadata = {
  title: "How it works — Acrossed",
  description:
    "Acrossed is a hosted decision engine. You send us a request fingerprint, we return ALLOW or DENY in under a millisecond. Here's the full mental model.",
};

const USE_CASES = [
  {
    title: "Block bad IPs across every service you run",
    body: "One ruleset, every app. When you ban an IP, it's banned in your frontend, your API, your admin panel — instantly. No syncing, no deploys.",
  },
  {
    title: "Stop credential stuffing at the edge",
    body: "Per-IP rate limit on /login at, say, 10 req/min. The check happens before your app spends a single CPU cycle on bcrypt or a database lookup.",
  },
  {
    title: "Geo-fence sensitive routes",
    body: "Block /admin or /checkout from countries you don't operate in. We map IP → ISO country code at engine speed using a baked-in MaxMind-format database.",
  },
  {
    title: "Lock internal endpoints behind a header",
    body: "Require X-Internal-Token on /admin/* — easy to roll, easy to audit, no app-level code to maintain.",
  },
  {
    title: "Time-window expensive operations",
    body: "Only allow /export between 9 AM and 9 PM weekdays. Rules can be scheduled.",
  },
];

const COMPARISON = [
  ["Acrossed", "Hosted, cryptographic, 1 SDK call. Sub-ms. Zero infra.", "✓"],
  ["nginx limit_req", "Self-hosted. Per-instance state. No central rules.", "—"],
  ["Cloudflare WAF", "Powerful but tied to Cloudflare's edge + opaque pricing.", "—"],
  ["Custom middleware", "Months of work. Distributed state to coordinate.", "—"],
];

export default function HowItWorksPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-12 pb-10 sm:pt-16 sm:pb-12">
          <div className="mx-auto max-w-page px-4 sm:px-6">
            <p className="eyebrow mb-3">How it works</p>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl lg:text-5xl">
              You ask a question. We give you an answer. That's it.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-ink-mid sm:text-[1.0625rem]">
              Acrossed is not a proxy, not a WAF appliance, not a piece of infrastructure
              you run. It's a hosted HTTP API that takes one input — "should I allow this
              request?" — and returns one output: <code className="rounded bg-white/5 px-1.5 py-0.5">allow</code>{" "}
              or <code className="rounded bg-white/5 px-1.5 py-0.5">deny</code>, signed.
            </p>
          </div>
        </section>

        <section className="border-t border-line py-12 sm:py-16">
          <div className="mx-auto grid max-w-page items-start gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="font-display text-xl font-semibold sm:text-2xl">The mental model</h2>
              <ol className="mt-6 space-y-5 text-ink-mid">
                <Step n="1" t="Your app receives a request.">
                  Could be a page view, an API call, a login attempt — anything.
                </Step>
                <Step n="2" t="The Acrossed SDK builds a fingerprint.">
                  IP, method, path, the headers you care about. No body. No PII you didn't
                  explicitly send.
                </Step>
                <Step n="3" t="It calls /check.">
                  One HTTPS POST. We sign it with your secret. Round-trip on a same-region
                  call: 5–25 ms. Engine work: under a millisecond.
                </Step>
                <Step n="4" t="We answer ALLOW or DENY, with a reason.">
                  Your code does <code className="rounded bg-white/5 px-1 py-0.5">if (d.deny) return 403</code>.
                  Done.
                </Step>
              </ol>
            </div>
            <CodeShowcase />
          </div>
        </section>

        <section className="border-t border-line py-12 sm:py-16">
          <div className="mx-auto max-w-page px-4 sm:px-6">
            <h2 className="font-display mb-6 text-xl font-semibold sm:mb-8 sm:text-2xl">When to use Acrossed</h2>
            <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
              {USE_CASES.map((u) => (
                <div key={u.title} className="bg-bg-base p-5 sm:p-6">
                  <h3 className="font-display text-base font-semibold">{u.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-mid">{u.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line py-12 sm:py-16">
          <div className="mx-auto max-w-page px-4 sm:px-6">
            <h2 className="font-display mb-6 text-xl font-semibold sm:mb-8 sm:text-2xl">How it compares</h2>
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="table-scroll">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-bg-elev text-left text-ink-low">
                    <tr>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider sm:px-5">Approach</th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider sm:px-5">What you actually get</th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider sm:px-5">Hosted &amp; stateless</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {COMPARISON.map(([a, b, c]) => (
                      <tr key={a} className="bg-bg-base">
                        <td className="px-4 py-4 font-medium text-ink-hi sm:px-5">{a}</td>
                        <td className="px-4 py-4 text-ink-mid sm:px-5">{b}</td>
                        <td className="px-4 py-4 font-mono text-ink-hi sm:px-5">{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-line py-12 sm:py-16">
          <div className="mx-auto max-w-page px-4 sm:px-6 text-center">
            <h2 className="font-display text-xl font-semibold sm:text-2xl">Convinced? Or have questions?</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/sign-up" className="btn btn-primary">Get an API key — free</Link>
              <Link href="/performance" className="btn btn-ghost">See the benchmarks →</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Step({ n, t, children }: { n: string; t: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[28px_1fr] gap-4">
      <span className="font-mono mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-line text-[10px] text-ink-mid">
        {n}
      </span>
      <div>
        <div className="font-medium text-ink-hi">{t}</div>
        <p className="mt-1 text-sm leading-relaxed">{children}</p>
      </div>
    </li>
  );
}
