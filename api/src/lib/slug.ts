// Slug generation for project subdomains. Format: <name-kebab>-<rand4>.
// Always lowercase, dns-safe, max 30 chars. Uniqueness enforced by DB unique index.
import { randomBytes } from "node:crypto";

const WORDLIST = ["swift", "iron", "neon", "atlas", "echo", "nova", "vela", "lyra", "orion", "kai", "axis", "flux", "pulse", "halo", "drift", "core"];

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 22);
}

function rand(n: number): string {
  return randomBytes(n)
    .toString("base64url")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(0, n);
}

/** Deterministic-ish slug seeded by project name plus a 4-char nonce. */
export function generateSlug(name: string): string {
  const base = kebab(name);
  if (!base) {
    return WORDLIST[Math.floor(Math.random() * WORDLIST.length)] + "-" + rand(4);
  }
  return `${base}-${rand(4)}`;
}

const RESERVED = new Set([
  "www", "api", "admin", "dashboard", "docs", "blog", "status", "app",
  "mail", "ftp", "static", "assets", "cdn", "images", "img", "auth", "login",
  "signup", "signin", "billing", "support", "help", "console",
]);

const HOST_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

export function isValidSlug(s: string): boolean {
  return HOST_RE.test(s) && !RESERVED.has(s);
}

const FQDN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

/** Strict validator for user-supplied custom domains. Lowercases & strips trailing dot. */
export function normalizeDomain(input: string): string | null {
  if (typeof input !== "string") return null;
  const d = input.trim().toLowerCase().replace(/\.$/, "");
  if (d.length < 4 || d.length > 253) return null;
  if (!FQDN_RE.test(d)) return null;
  // Disallow attaching subdomains of our own zones — those auto-route via wildcard.
  if (d.endsWith(".acrossed.com") || d === "acrossed.com") return null;
  if (d.endsWith(".acrsd.dev") || d === "acrsd.dev") return null;
  return d;
}
