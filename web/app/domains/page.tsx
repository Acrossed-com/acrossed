import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";
import { internalFetch } from "@/lib/internalApi";

export const metadata: Metadata = {
  title: "Premium Domains — Acrossed",
  description: "Explore premium domain names available through Acrossed. Make an offer for any listed domain.",
};

export const dynamic = "force-dynamic";

interface DomainListing {
  id: string;
  domain: string;
  price: string;
  description: string;
  category: string;
  featured: boolean;
  status: "available" | "sold" | "reserved";
}

async function getDomains(): Promise<DomainListing[]> {
  try {
    return await internalFetch<DomainListing[]>("/admin/domains");
  } catch {
    return [];
  }
}

export default async function DomainsPage() {
  const domains = await getDomains();

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
          Interested in a domain? Send your offer.
        </p>

        {domains.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {domains.map((d) => (
              <div key={d.id} className="surface group relative overflow-hidden p-5" style={{ transition: "border-color 200ms ease" }}>
                {d.featured && (
                  <span className="font-mono absolute right-3 top-3 rounded-full border border-[rgba(110,139,255,0.3)] bg-[rgba(110,139,255,0.08)] px-2 py-0.5 text-[10px] uppercase tracking-widest" style={{ color: "#6E8BFF" }}>
                    Featured
                  </span>
                )}
                <p className="font-display text-lg font-semibold" style={{ color: "#ECEDEE", letterSpacing: "-0.01em" }}>{d.domain}</p>
                {d.category && (
                  <span className="mt-2 inline-block rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-widest" style={{ color: "#71717A", fontFamily: "'JetBrains Mono', monospace" }}>
                    {d.category}
                  </span>
                )}
                <p className="mt-3 text-sm" style={{ color: "#A1A1AA", fontFamily: "'Supreme', sans-serif", lineHeight: 1.5 }}>{d.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-display text-xl font-semibold" style={{ color: d.status === "sold" ? "#71717A" : "#ECEDEE" }}>
                    {d.status === "sold" ? "Sold" : d.price}
                  </span>
                  {d.status === "available" && (
                    <a
                      href={`mailto:hi@acrossed.com?subject=Domain Inquiry: ${d.domain}&body=Hi, I am interested in the domain ${d.domain}. My offer is: `}
                      className="btn btn-ghost text-xs"
                    >
                      Make offer
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="surface mt-10 p-10 text-center">
            <p className="font-display text-lg font-semibold" style={{ color: "#ECEDEE" }}>Coming soon</p>
            <p className="mt-2 text-sm" style={{ color: "#A1A1AA", fontFamily: "'Supreme', sans-serif" }}>
              Premium domains are being curated. Check back soon or contact{" "}
              <a href="mailto:hi@acrossed.com" style={{ color: "#6E8BFF" }}>hi@acrossed.com</a> for inquiries.
            </p>
          </div>
        )}

        <div className="mt-14 surface p-6">
          <h2 className="font-display text-lg font-semibold" style={{ color: "#ECEDEE" }}>How it works</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { step: "01", title: "Browse", desc: "Find a domain that fits your brand from our curated list." },
              { step: "02", title: "Make an offer", desc: "Click 'Make offer' and send us your price via email." },
              { step: "03", title: "Transfer", desc: "Once agreed, we transfer the domain to your registrar within 24 hours." },
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