import Link from "next/link";
import { RiCheckLine as Check, RiFlashlightLine as Zap } from "@remixicon/react";
interface Plan {
  id: "free" | "pro" | "scale" | "business" | "enterprise";
  name: string;
  tagline: string;
  price: string;
  cadence: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Drop Acrossed in front of one app and try it.",
    price: "$0",
    cadence: "forever",
    features: [
      "10,000 decisions / month",
      "Up to 5 active rules",
      "Default &lt;slug&gt;.acrsd.dev subdomain with TLS",
      "AES-256-GCM encrypted rule storage",
      "HMAC-SHA256 signed responses",
      "JS, Python, and Go SDKs",
    ],
    cta: "Start free",
    href: "/sign-up",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For production apps with real traffic.",
    price: "$19",
    cadence: "per month",
    features: [
      "1,000,000 decisions / month",
      "Up to 100 active rules",
      "Up to 3 custom domains with on-demand TLS",
      "Country-level geo blocking",
      "Per-IP rate limiting at engine speed",
      "Pay-as-you-go: $0.10 / extra 1K",
    ],
    cta: "Upgrade to Pro",
    href: "/sign-up?plan=pro",
    highlight: true,
    badge: "Most popular",
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "SaaS, marketplaces, and high-traffic APIs.",
    price: "$99",
    cadence: "per month",
    features: [
      "10,000,000 decisions / month",
      "Up to 500 active rules",
      "Up to 10 custom domains with on-demand TLS",
      "Country-level geo blocking",
      "Per-IP rate limiting at engine speed",
      "Pay-as-you-go: $0.08 / extra 1K",
    ],
    cta: "Upgrade to Scale",
    href: "/sign-up?plan=scale",
  },
  {
    id: "business",
    name: "Business",
    tagline: "For teams that need audit logs and multi-region.",
    price: "$299",
    cadence: "per month",
    features: [
      "50,000,000 decisions / month",
      "Up to 2,500 active rules",
      "Up to 25 custom domains with on-demand TLS",
      "Audit log export (CSV, JSON)",
      "Multi-region routing (US + EU)",
      "Pay-as-you-go: $0.05 / extra 1K",
      "Priority chat support",
    ],
    cta: "Upgrade to Business",
    href: "/sign-up?plan=business",
  },
];

const ENTERPRISE: Plan = {
  id: "enterprise",
  name: "Enterprise",
  tagline: "Custom volume, custom contract, direct line to the maintainer.",
  price: "Custom",
  cadence: "talk to us",
  features: [
    "Unlimited decisions (custom-priced)",
    "Direct Slack channel with the maintainer",
    "Custom contract & invoicing terms",
  ],
  cta: "Contact sales",
  href: "mailto:hello@acrossed.com?subject=Enterprise%20plan",
};

export function Pricing({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "py-14 sm:py-16" : "border-t border-line py-16 sm:py-20"}>
      <div className="mx-auto max-w-page px-4 sm:px-6">
        {!compact && (
          <div className="mb-10 max-w-2xl">
            <p
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#6E8BFF",
                marginBottom: 14,
              }}
            >
              Pricing
            </p>
            <h2
              className="font-display"
              style={{
                fontSize: "clamp(1.875rem, 3.5vw, 2.625rem)",
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: "-0.025em",
                color: "#ECEDEE",
              }}
            >
              Pay for volume, never for protection.
            </h2>
            <p
              style={{
                fontFamily: "'Supreme', 'Switzer', sans-serif",
                fontSize: "1.0625rem",
                lineHeight: 1.55,
                color: "#A1A1AA",
                marginTop: 18,
                maxWidth: 600,
              }}
            >
              Every plan ships with HMAC-signed responses, AES-256 encrypted rules,
              and sub-millisecond decisions. Outgrew your tier mid-month? Pay-as-you-go
              kicks in automatically &mdash; no failed checks.
            </p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-4 lg:gap-5">
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
        </div>

        <div className="mt-5">
          <EnterpriseCard plan={ENTERPRISE} />
        </div>

        <div
          style={{
            marginTop: 28,
            padding: "20px 24px",
            border: "1px solid rgba(110,139,255,0.18)",
            background:
              "linear-gradient(180deg, rgba(110,139,255,0.06) 0%, rgba(110,139,255,0.02) 100%)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "rgba(110,139,255,0.12)",
              border: "1px solid rgba(110,139,255,0.2)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap className="h-4 w-4" style={{ color: "#6E8BFF" }} strokeWidth={1.6} />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div
              className="font-display"
              style={{ fontSize: 15, fontWeight: 600, color: "#ECEDEE" }}
            >
              Pay-as-you-go is on by default for Pro, Scale, and Business.
            </div>
            <div
              style={{
                fontFamily: "'Supreme', 'Switzer', sans-serif",
                fontSize: 13.5,
                color: "#A1A1AA",
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              Outgrew your monthly cap? We keep deciding &mdash; overage is billed at
              the end of the cycle at your plan&apos;s per-1K rate. Toggle off in your
              dashboard if you&apos;d rather hard-cap.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const isHighlight = plan.highlight;
  return (
    <div
      style={{
        position: "relative",
        padding: "28px 24px",
        borderRadius: 14,
        border: isHighlight
          ? "1px solid rgba(110,139,255,0.45)"
          : "1px solid rgba(255,255,255,0.08)",
        background: isHighlight
          ? "linear-gradient(180deg, rgba(110,139,255,0.08) 0%, rgba(110,139,255,0.015) 100%), #07090d"
          : "#07090d",
        boxShadow: isHighlight
          ? "0 0 0 1px rgba(110,139,255,0.15), 0 20px 60px -20px rgba(110,139,255,0.35)"
          : "none",
      }}
    >
      {plan.badge && (
        <span
          style={{
            position: "absolute",
            top: -10,
            right: 18,
            padding: "3px 10px",
            fontSize: 10.5,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            background: "#6E8BFF",
            color: "#07090d",
            borderRadius: 4,
            fontWeight: 600,
          }}
        >
          {plan.badge}
        </span>
      )}
      <div
        className="font-display"
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "#ECEDEE",
          letterSpacing: "-0.01em",
        }}
      >
        {plan.name}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          color: "#A1A1AA",
          fontFamily: "'Supreme', sans-serif",
          minHeight: 38,
          lineHeight: 1.45,
        }}
      >
        {plan.tagline}
      </div>
      <div style={{ marginTop: 20, display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          className="font-display"
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: "#ECEDEE",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {plan.price}
        </span>
        <span style={{ fontSize: 12.5, color: "#71717A", fontFamily: "'Supreme', sans-serif" }}>
          {plan.cadence}
        </span>
      </div>
      <Link
        href={plan.href}
        style={{
          display: "flex",
          marginTop: 20,
          padding: "10px 14px",
          fontSize: 13.5,
          fontWeight: 500,
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 7,
          background: isHighlight ? "#ECEDEE" : "rgba(255,255,255,0.04)",
          color: isHighlight ? "#07090d" : "#ECEDEE",
          border: isHighlight ? "none" : "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {plan.cta}
      </Link>
      <ul style={{ marginTop: 22, display: "grid", gap: 10 }}>
        {plan.features.map((f) => (
          <li key={f} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
            <Check
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: "#6E8BFF", marginTop: 3 }}
              strokeWidth={2.2}
            />
            <span
              style={{
                fontSize: 12.5,
                color: "#C4C4CB",
                fontFamily: "'Supreme', sans-serif",
                lineHeight: 1.45,
              }}
              dangerouslySetInnerHTML={{ __html: f }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function EnterpriseCard({ plan }: { plan: Plan }) {
  return (
    <div
      style={{
        padding: "26px 28px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "#07090d",
        display: "grid",
        gap: 24,
        gridTemplateColumns: "minmax(220px, 1fr) auto",
        alignItems: "center",
      }}
      className="enterprise-card"
    >
      <div>
        <div className="flex items-center gap-3">
          <span
            className="font-display"
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#ECEDEE",
              letterSpacing: "-0.01em",
            }}
          >
            {plan.name}
          </span>
          <span
            style={{
              fontSize: 10.5,
              padding: "3px 9px",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#6E8BFF",
              border: "1px solid rgba(110,139,255,0.25)",
              borderRadius: 4,
            }}
          >
            Custom
          </span>
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 13.5,
            color: "#A1A1AA",
            fontFamily: "'Supreme', sans-serif",
            lineHeight: 1.5,
            maxWidth: 560,
          }}
        >
          {plan.tagline} &middot; {plan.features.join(" \u00b7 ")}
        </div>
      </div>
      <Link
        href={plan.href}
        style={{
          display: "inline-flex",
          padding: "10px 18px",
          fontSize: 13.5,
          fontWeight: 500,
          borderRadius: 7,
          background: "rgba(255,255,255,0.04)",
          color: "#ECEDEE",
          border: "1px solid rgba(255,255,255,0.12)",
          whiteSpace: "nowrap",
        }}
      >
        {plan.cta}
      </Link>
    </div>
  );
}
