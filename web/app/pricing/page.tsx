import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Pricing } from "@/components/Pricing";

export const metadata: Metadata = {
  title: "Pricing — Acrossed",
  description:
    "Four plans. Free, $19 Pro, $99 Scale, $299 Business, custom Enterprise. Every plan includes the full security stack. You pay for volume, not for the protections.",
};

const FAQ: Array<[string, string]> = [
  [
    "What happens when I exceed my monthly decision cap?",
    "Our /check endpoint returns HTTP 402 with an upgrade link. Our SDK treats that as a deny by default so you don't accidentally let traffic through unmetered. You can flip a flag to allow on quota-exceeded if you'd rather.",
  ],
  [
    "Is the encryption real, or marketing?",
    "Real. Rules and signing secrets are encrypted with AES-256-GCM before they're written to Postgres. Decryption happens once at API process startup; the plaintext lives in process memory and is never written to disk or logged.",
  ],
  [
    "Do you store my user traffic?",
    "No. The /check call carries a small fingerprint — IP, method, path, a handful of headers you choose. We evaluate the rules and forget. We persist counters (decisions/month, allow/deny) for billing and your dashboard, but never the request body.",
  ],
  [
    "Why charge for custom domains?",
    "Each custom domain consumes a TLS certificate slot via Let's Encrypt and a small amount of edge capacity. We cap them per plan to keep the platform cheap for everyone.",
  ],
  [
    "Can I downgrade?",
    "Yes. Downgrades take effect at the end of your current billing period. Your monthly decision counter does not reset on downgrade.",
  ],
  [
    "Do you offer a free trial of Pro?",
    "No formal trial. Free gives you the full security stack (HMAC signing, AES-256 encryption, all three SDKs) at 10K decisions/month so you can wire it into a real app and prove it out. When you need custom domains, country-level geo blocking, or per-IP rate limiting, that's Pro.",
  ],
];

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="pt-16 pb-4">
          <div className="mx-auto max-w-page px-6 text-center">
            <p className="eyebrow mb-3">Pricing</p>
            <h1 className="font-display text-4xl font-semibold sm:text-5xl">
              Five plans. No surprises.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-ink-mid">
              Every plan includes HMAC-signed responses, AES-256 encrypted rule storage, and
              sub-ms decisions. You're paying for volume and concurrent rules — never for
              the security itself.
            </p>
          </div>
        </section>

        <Pricing compact />

        <section className="border-t border-line py-20">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="font-display mb-8 text-2xl font-semibold">Pricing FAQ</h2>
            <dl className="divide-y divide-line">
              {FAQ.map(([q, a]) => (
                <div key={q} className="py-5">
                  <dt className="font-display text-lg font-semibold text-ink-hi">{q}</dt>
                  <dd className="mt-2 text-ink-mid">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
