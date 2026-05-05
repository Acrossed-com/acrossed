import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

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
  verified: boolean;
  landing_headline: string;
  landing_tagline: string;
  landing_description: string;
  landing_keywords: string[];
  landing_color_primary: string;
  landing_color_secondary: string;
  landing_font: string;
  landing_use_cases: string[];
  landing_industry: string;
  contact_email: string;
}

async function getDomain(slug: string): Promise<DomainListing | null> {
  try {
    const url = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:4000";
    const res = await fetch(`${url}/admin/domains/by-slug/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const domain = await getDomain(slug);
  if (!domain) return { title: "Domain Not Found — Acrossed" };
  return {
    title: `${domain.domain} — Premium Domain For Sale`,
    description: domain.landing_description || `${domain.domain} is available for purchase. ${domain.price}`,
    keywords: domain.landing_keywords?.join(", "),
  };
}

export default async function DomainLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const domain = await getDomain(slug);

  if (!domain) {
    redirect("/domains");
  }

  const primary = domain.landing_color_primary || "#6E8BFF";
  const secondary = domain.landing_color_secondary || "#0a0a1a";
  const font = domain.landing_font || "Inter";
  const domainName = domain.domain.replace(/\.(com|io|dev|co|net|org|ai)$/i, "");

  return (
    <>
      {/* Google Font */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href={`https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`} rel="stylesheet" />

      <div style={{ background: secondary, minHeight: "100vh", fontFamily: `'${font}', sans-serif` }}>
        {/* Top bar with Acrossed branding */}
        <header style={{ borderBottom: `1px solid ${primary}15`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="https://acrossed.com" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <svg width="24" height="24" viewBox="0 0 1280 1280" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M640 0L1280 640L640 1280L0 640L640 0Z" fill={primary} fillOpacity="0.15"/>
              <path d="M640 160L1120 640L640 1120L160 640L640 160Z" fill={primary} fillOpacity="0.3"/>
              <path d="M640 320L960 640L640 960L320 640L640 320Z" fill={primary}/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: `${primary}99`, letterSpacing: "-0.02em" }}>acrossed</span>
          </Link>
          <Link href="/domains" style={{ fontSize: 13, color: "#A1A1AA", textDecoration: "none" }}>← Browse all domains</Link>
        </header>

        {/* Hero section */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
          {/* Domain badge */}
          <div style={{
            display: "inline-block",
            padding: "6px 20px",
            borderRadius: 999,
            background: `${primary}12`,
            border: `1px solid ${primary}30`,
            fontSize: 12,
            fontWeight: 500,
            color: primary,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 32,
          }}>
            {domain.status === "available" ? "Available for Purchase" : domain.status === "sold" ? "Sold" : "Reserved"}
          </div>

          {/* Domain name - BIG */}
          <h1 style={{
            fontSize: "clamp(48px, 8vw, 96px)",
            fontWeight: 700,
            color: "#ECEDEE",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            marginBottom: 16,
          }}>
            {domain.domain}
          </h1>

          {/* AI headline */}
          <p style={{
            fontSize: "clamp(20px, 3vw, 32px)",
            fontWeight: 600,
            color: primary,
            lineHeight: 1.3,
            marginBottom: 16,
          }}>
            {domain.landing_headline}
          </p>

          {/* Tagline */}
          <p style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "#A1A1AA",
            maxWidth: 600,
            margin: "0 auto 40px",
            lineHeight: 1.5,
          }}>
            {domain.landing_tagline}
          </p>

          {/* Price */}
          {domain.status === "available" && (
            <div style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 12,
              background: `${primary}08`,
              border: `1px solid ${primary}20`,
              borderRadius: 16,
              padding: "20px 40px",
              marginBottom: 32,
            }}>
              <span style={{ fontSize: 48, fontWeight: 700, color: "#ECEDEE" }}>{domain.price}</span>
            </div>
          )}

          {/* CTA */}
          {domain.status === "available" && (
            <div style={{ marginTop: 24 }}>
              <a
                href={`mailto:${domain.contact_email || "forsale@acrossed.com"}?subject=Inquiry: ${domain.domain}&body=Hi, I am interested in purchasing ${domain.domain}. My offer is: `}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: primary,
                  color: "#fff",
                  padding: "14px 32px",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "opacity 150ms",
                }}
              >
                Make an Offer →
              </a>
              <p style={{ fontSize: 13, color: "#71717A", marginTop: 12 }}>
                or contact <a href={`mailto:${domain.contact_email || "forsale@acrossed.com"}`} style={{ color: primary }}>{domain.contact_email || "forsale@acrossed.com"}</a>
              </p>
            </div>
          )}
        </div>

        {/* Description + Use Cases */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 60px" }}>
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            padding: 32,
          }}>
            <p style={{ fontSize: 16, color: "#A1A1AA", lineHeight: 1.7, marginBottom: 24 }}>
              {domain.landing_description}
            </p>

            {domain.landing_use_cases?.length > 0 && (
              <>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  Perfect for
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {domain.landing_use_cases.map((uc, i) => (
                    <span key={i} style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      background: `${primary}10`,
                      border: `1px solid ${primary}20`,
                      fontSize: 13,
                      color: primary,
                      fontWeight: 500,
                    }}>
                      {uc}
                    </span>
                  ))}
                </div>
              </>
            )}

            {domain.category && (
              <div style={{ marginTop: 20 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#71717A",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  Industry: {domain.landing_industry || domain.category}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Features strip */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "32px 24px", maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            {[
              { icon: "🔒", title: "Secure Transfer", desc: "Domain transferred via your registrar within 24 hours" },
              { icon: "⚡", title: "Instant Setup", desc: "Point to any hosting or use with Acrossed security" },
              { icon: "🛡️", title: "Buyer Protection", desc: "Escrow-backed transaction for complete safety" },
            ].map((f, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <span style={{ fontSize: 28 }}>{f.icon}</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#ECEDEE", marginTop: 8 }}>{f.title}</p>
                <p style={{ fontSize: 12, color: "#71717A", marginTop: 4, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with Acrossed branding */}
        <footer style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "24px",
          textAlign: "center",
          fontSize: 12,
          color: "#71717A",
        }}>
          <Link href="https://acrossed.com" style={{ color: primary, textDecoration: "none" }}>
            Powered by Acrossed
          </Link>
          {" · "}
          <Link href="/domains" style={{ color: "#71717A", textDecoration: "none" }}>
            Browse more domains
          </Link>
        </footer>
      </div>
    </>
  );
}
