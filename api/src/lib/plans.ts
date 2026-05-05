// Pricing tiers — single source of truth for quotas, features, and limits.
//
// Quotas are enforced cheaply at the /check hot path against an in-memory
// counter that resets monthly (see store.ts -> tryConsumeQuota). When a plan
// is upgraded via the Polar webhook, the cap moves immediately.
//
// Every feature listed below MUST be something the platform actually does
// today. No aspirational items.

export type PlanId = "free" | "pro" | "scale" | "business" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  /** One-line value pitch shown under the price. */
  tagline: string;
  priceUsdMonthly: number;
  /** Hard cap on /check requests per project per calendar month. */
  monthlyChecks: number;
  /** Max concurrent rules per project. */
  maxRules: number;
  /** Custom-domain attachments allowed per project. */
  maxCustomDomains: number;
  /** Default subdomain count under acrsd.dev. Always 1 — every project gets one. */
  defaultSubdomain: 1;
  features: string[];
  /** Polar product price id for the upgrade flow; null on Free + Enterprise. */
  polarPriceId: string | null;
  /** Cents per 1,000 decisions over the monthly cap, when PAYG is enabled. */
  overageCentsPer1k: number | null;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Drop Acrossed in front of one app and try it.",
    priceUsdMonthly: 0,
    monthlyChecks: 10_000,
    maxRules: 5,
    maxCustomDomains: 0,
    defaultSubdomain: 1,
    polarPriceId: null,
    overageCentsPer1k: null,
    features: [
      "10,000 decisions per month",
      "Up to 5 active rules",
      "Default <slug>.acrsd.dev subdomain with TLS",
      "AES-256-GCM encrypted rule storage",
      "HMAC-SHA256 signed responses",
      "JS, Python, and Go SDKs",
      "Sub-millisecond engine latency",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For production apps with real traffic.",
    priceUsdMonthly: 19,
    monthlyChecks: 1_000_000,
    maxRules: 100,
    maxCustomDomains: 3,
    defaultSubdomain: 1,
    polarPriceId: "3d9f970d-7875-4fdb-98fd-c5d21987d6ed",
    overageCentsPer1k: 10,
    features: [
      "1,000,000 decisions per month",
      "Up to 100 active rules",
      "Up to 3 custom domains with on-demand TLS",
      "Country-level geo blocking",
      "Per-IP rate limiting at engine speed",
      "Pay-as-you-go: $0.10 per extra 1K decisions",
      "Email support",
    ],
  },
  scale: {
    id: "scale",
    name: "Scale",
    tagline: "SaaS, marketplaces, and high-traffic APIs.",
    priceUsdMonthly: 99,
    monthlyChecks: 10_000_000,
    maxRules: 500,
    maxCustomDomains: 10,
    defaultSubdomain: 1,
    polarPriceId: "2af392d6-ce0a-4767-ae38-74095b3a3bb2",
    overageCentsPer1k: 8,
    features: [
      "10,000,000 decisions per month",
      "Up to 500 active rules",
      "Up to 10 custom domains",
      "Country-level geo blocking",
      "Per-IP rate limiting at engine speed",
      "Pay-as-you-go: $0.08 per extra 1K decisions",
      "Slack/Discord webhooks for blocked traffic",
      "Priority email support",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "For teams that need volume, audit logs, and SSO.",
    priceUsdMonthly: 299,
    monthlyChecks: 50_000_000,
    maxRules: 2_500,
    maxCustomDomains: 25,
    defaultSubdomain: 1,
    polarPriceId: "c8371a7f-2c12-4695-ac60-954eb326bab7",
    overageCentsPer1k: 5,
    features: [
      "50,000,000 decisions per month",
      "Up to 2,500 active rules",
      "Up to 25 custom domains",
      "SSO via Google Workspace + Okta",
      "Audit log export (CSV, JSON)",
      "Multi-region routing (US-East + EU-West)",
      "Pay-as-you-go: $0.05 per extra 1K decisions",
      "Priority email + chat support",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom volume, dedicated capacity, and an SLA.",
    priceUsdMonthly: 0,
    monthlyChecks: 1_000_000_000,
    maxRules: 25_000,
    maxCustomDomains: 250,
    defaultSubdomain: 1,
    polarPriceId: null,
    overageCentsPer1k: null,
    features: [
      "Unlimited decisions (custom-priced)",
      "Up to 25,000 active rules",
      "Up to 250 custom domains",
      "Dedicated single-tenant engine option",
      "99.99% uptime SLA",
      "On-prem / VPC deployment available",
      "Direct Slack channel with the maintainer",
    ],
  },
};

export function planFor(id: string | null | undefined): Plan {
  if (id === "pro" || id === "scale" || id === "business" || id === "enterprise") return PLANS[id];
  return PLANS.free;
}

/** Beginning of the current calendar month, UTC, in ms. Used as quota reset boundary. */
export function currentBillingPeriodStart(now = new Date()): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
}
