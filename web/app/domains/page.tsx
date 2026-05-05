import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Premium Domains — Acrossed",
  description: "Explore premium domain names available through Acrossed. Make an offer for any listed domain.",
};

export const dynamic = "force-dynamic";

interface DomainListing {
  id: string;
  domain: string;
  slug: string;
  price: string;
  description: string;
  category: string;
  featured: boolean;
  status: "available" | "sold" | "reserved";
  landing_headline: string;
  landing_tagline: string;
  landing_color_primary: string;
  landing_industry: string;
  contact_email: string;
}

async function getDomains(): Promise<DomainListing[]> {
  try {
    const url = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:4000";
    const res = await fetch(`${url}/admin/domains`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function DomainsPage() {
  const domains = await getDomains();
  const available = domains.filter((d) => d.status === "available");
  const featured = available.filter((d) => d.featured);
  const regular = available.filter((d) => !d.featured);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-16 sm:px-7 sm:pt-20">
        <p className="eyebrow mb-3">Marketplace</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: "#ECEDEE" }}>
          Premium Domains
        </h1>
        <p style={{ fontFamily: "'Supreme', sans-serif", fontSize: "1.0625rem", lineHeight: 1.55, color: "#A1A1AA", marginTop: 14, maxWidth: 600 }}>
          Curated domain names for startups, SaaS products, and developer tools.
          Each domain comes with an AI-generated landing page ready for your brand.
        </p>

        {/* Featured domains */}
        {featured.length > 0 && (
          <section className="mt-10">
            <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: "#6E8BFF" }}>Featured</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {featured.map((d) => (
                <Link key={d.id} href={`/domains/${d.slug}`} className="surface group relative overflow-hidden p-6 transition-all hover:border-[rgba(110,139,255,0.3)]" style={{ textDecoration: "none" }}>
                  <span className="font-mono absolute right-4 top-4 rounded-full border border-[rgba(110,139,255,0.3)] bg-[rgba(110,139,255,0.08)] px-2 py-0.5 text-[10px] uppercase tracking-widest" style={{ color: "#6E8BFF" }}>
                    Featured
                  </span>
                  <p className="font-display text-xl font-semibold" style={{ color: "#ECEDEE", letterSpacing: "-0.01em" }}>{d.domain}</p>
                  {d.landing_headline && (
                    <p className="mt-2 text-sm" style={{ color: d.landing_color_primary || "#6E8BFF" }}>{d.landing_headline}</p>
                  )}
                  {d.category && (
                    <span className="mt-3 inline-block rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-widest" style={{ color: "#71717A", fontFamily: "'JetBrains Mono', monospace" }}>
                      {d.category}
                    </span>
                  )}
                  <p className="mt-3 text-sm" style={{ color: "#A1A1AA", fontFamily: "'Supreme', sans-serif", lineHeight: 1.5 }}>
                    {d.landing_tagline || d.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-xl font-semibold" style={{ color: "#ECEDEE" }}>{d.price}</span>
                    <span className="text-xs" style={{ color: "#6E8BFF" }}>View details →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Regular domains */}
        {regular.length > 0 && (
          <section className="mt-8">
            {featured.length > 0 && <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: "#71717A" }}>All Domains</p>}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {regular.map((d) => (
                <Link key={d.id} href={`/domains/${d.slug}`} className="surface group relative overflow-hidden p-5 transition-all hover:border-line-strong" style={{ textDecoration: "none" }}>
                  <p className="font-display text-lg font-semibold" style={{ color: "#ECEDEE", letterSpacing: "-0.01em" }}>{d.domain}</p>
                  {d.category && (
                    <span className="mt-2 inline-block rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-widest" style={{ color: "#71717A", fontFamily: "'JetBrains Mono', monospace" }}>
                      {d.category}
                    </span>
                  )}
                  <p className="mt-3 text-sm" style={{ color: "#A1A1AA", fontFamily: "'Supreme', sans-serif", lineHeight: 1.5 }}>
                    {d.landing_tagline || d.description || "Premium domain for sale"}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-xl font-semibold" style={{ color: "#ECEDEE" }}>{d.price}</span>
                    <span className="text-xs" style={{ color: "#6E8BFF" }}>View →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {available.length === 0 && (
          <div className="surface mt-10 p-10 text-center">
            <p className="font-display text-lg font-semibold" style={{ color: "#ECEDEE" }}>Coming soon</p>
            <p className="mt-2 text-sm" style={{ color: "#A1A1AA", fontFamily: "'Supreme', sans-serif" }}>
              Premium domains are being curated. Check back soon or contact{" "}
              <a href="mailto:forsale@acrossed.com" style={{ color: "#6E8BFF" }}>forsale@acrossed.com</a> for inquiries.
            </p>
          </div>
        )}

        {/* How it works */}
        <div className="mt-14 surface p-6">
          <h2 className="font-display text-lg font-semibold" style={{ color: "#ECEDEE" }}>How it works</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { step: "01", title: "Browse", desc: "Find a domain that fits your brand. Each has an AI-generated preview." },
              { step: "02", title: "Make an offer", desc: "Click into any domain to see details and submit your offer." },
              { step: "03", title: "Transfer", desc: "Once agreed, we transfer via escrow within 24 hours." },
            ].map((s) => (
              <div key={s.step}>
                <span className="font-mono text-xs" style={{ color: "#6E8BFF" }}>{s.step}</span>
                <p className="font-display mt-1 text-sm font-semibold" style={{ color: "#ECEDEE" }}>{s.title}</p>
                <p className="mt-1 text-xs" style={{ color: "#A1A1AA", fontFamily: "'Supreme', sans-serif", lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>


      </main>
      <Footer />
    </>
  );
}
