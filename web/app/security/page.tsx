import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SecuritySection } from "@/components/SecuritySection";

export const metadata: Metadata = {
  title: "Security — Acrossed",
  description:
    "AES-256-GCM at rest, HMAC-SHA256 in flight, stateless on your traffic. Here's exactly what we do and what we don't.",
};

const ATTACK_TABLE: Array<[string, string]> = [
  [
    "Man-in-the-middle forging an ALLOW",
    "Every response is signed with HMAC-SHA256 over (timestamp + body) using your project's signing secret. The SDK rejects the response if the signature doesn't verify. The secret never leaves your servers.",
  ],
  [
    "Replayed response from a previous ALLOW",
    "The HMAC payload includes a timestamp. The SDK rejects responses older than 60 seconds. Tighten the window per project if you need to.",
  ],
  [
    "Database compromise leaking your rules or secret",
    "Both your rule JSON and your signing secret are encrypted with AES-256-GCM before insert. The encryption key is held in API process env vars and never written to disk in plaintext. A stolen DB dump returns ciphertext.",
  ],
  [
    "Rogue admin reading customer rules",
    "Same answer — the only place plaintext exists is the API process memory after key-derivation at boot. No log line, no audit trail entry contains the cleartext.",
  ],
  [
    "Acrossed outage taking down your app",
    "All SDKs fail open by default. If our API is unreachable, your request passes. You can opt into fail-closed if your threat model requires it.",
  ],
  [
    "Quota exhaustion silently letting traffic through",
    "When you hit your monthly cap, /check returns HTTP 402. The SDK treats that as a deny by default — you have to explicitly opt in to allow-on-quota-exceeded behaviour.",
  ],
];

export default function SecurityPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-12 pb-4 sm:pt-16">
          <div className="mx-auto max-w-page px-4 sm:px-6">
            <p className="eyebrow mb-3">Security model</p>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl lg:text-5xl">
              The boring kind of security.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-ink-mid sm:text-[1.0625rem]">
              No vague trust badges. No "enterprise-grade" hand-waving. Here's the actual
              cryptography we use, the threats we explicitly defend against, and the things
              we deliberately do <em>not</em> claim.
            </p>
          </div>
        </section>

        <SecuritySection />

        <section className="border-t border-line py-12 sm:py-16">
          <div className="mx-auto max-w-page px-4 sm:px-6">
            <h2 className="font-display mb-6 text-xl font-semibold sm:mb-8 sm:text-2xl">Threats we defend against</h2>
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="table-scroll">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-bg-elev text-left text-ink-low">
                    <tr>
                      <th className="w-1/3 px-4 py-3 text-xs font-medium uppercase tracking-wider sm:px-5">Threat</th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider sm:px-5">How Acrossed handles it</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {ATTACK_TABLE.map(([t, h]) => (
                      <tr key={t} className="bg-bg-base align-top">
                        <td className="px-4 py-4 font-medium text-ink-hi sm:px-5">{t}</td>
                        <td className="px-4 py-4 text-ink-mid sm:px-5">{h}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-line py-12 sm:py-16">
          <div className="mx-auto max-w-page px-4 sm:px-6">
            <h2 className="font-display mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl">
              Want decision logs? Use your own database.
            </h2>
            <p className="max-w-3xl text-ink-mid">
              By default we store <strong className="text-ink-hi">nothing</strong> about your traffic — only
              aggregate counters (allowed / denied / monthly total). If you want a full audit trail, you
              can plug your own Postgres URL into any project from the dashboard. We'll{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5">INSERT</code> one row per decision into
              your database, asynchronously, off the hot path. The connection string is encrypted with
              AES-256-GCM before it hits our database.
            </p>
            <ul className="mt-5 max-w-3xl space-y-2 text-sm text-ink-mid">
              <li>• You own the schema. We auto-create one table the first time you enable it.</li>
              <li>• You own retention. We never read or trim the data — that's your DB.</li>
              <li>• Disable any time. Existing rows stay where they are.</li>
              <li>• Works with any Postgres-compatible host: Neon, Supabase, RDS, self-hosted.</li>
            </ul>
            <p className="mt-5 text-xs text-ink-low">
              Decision writes are fire-and-forget — the /check response never waits on your DB. If your
              DB is down, decisions still flow; we just drop the log row and surface the last error in
              your dashboard.
            </p>
          </div>
        </section>

        <section className="border-t border-line py-12 sm:py-16">
          <div className="mx-auto max-w-page px-4 sm:px-6">
            <h2 className="font-display mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl">What we do NOT claim</h2>
            <ul className="space-y-3 text-ink-mid">
              <li>• <strong className="text-ink-hi">No SOC 2 / ISO 27001 yet.</strong> We're a small operation — those certifications cost real money and we'd rather be transparent than fake them.</li>
              <li>• <strong className="text-ink-hi">No formal SLA.</strong> We run on a single VPS with monitored uptime. If you need a contractual SLA, write us — we'll talk Enterprise.</li>
              <li>• <strong className="text-ink-hi">No SSO / SAML.</strong> We use Clerk for auth. If you need SSO via Clerk, you can configure it on your Clerk org. We don't broker enterprise IdP flows ourselves.</li>
              <li>• <strong className="text-ink-hi">No regional data residency.</strong> All traffic terminates at one region today. We'll add regions when traffic warrants it.</li>
            </ul>
            <p className="mt-6 text-sm text-ink-low">
              We'd rather lose a deal because we don't have a checkbox than win one and
              ship something that's not real.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
