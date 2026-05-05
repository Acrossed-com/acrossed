/**
 * Acrossed SDK — cryptographic rule enforcement across systems.
 *
 * Universal runtime: works in Node.js, Deno, Bun, Cloudflare Workers,
 * Vercel Edge, and all modern browsers. Prefers Web Crypto API and
 * falls back to Node.js `node:crypto` when `crypto.subtle` is unavailable.
 */

export interface AcrossedClientOptions {
  apiKey: string;
  signingSecret: string;
  baseUrl?: string; // defaults to https://api.acrossed.com
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface CheckPayload {
  ip?: string;
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

export interface CheckResult {
  decision: "allow" | "deny";
  reason: string;
  matchedRule?: string;
  latencyUs: number;
}

export interface SignedRequest {
  url: string;
  method: "POST";
  headers: Record<string, string>;
  body: string;
}

const DEFAULT_BASE = "https://api.acrossed.com";

// ── Universal HMAC-SHA256 ──────────────────────────────────────────────────
// Uses Web Crypto (available in Edge/Browser/Deno/Bun) first.
// Falls back to Node.js `node:crypto` for traditional Node.js environments.

async function hmacSHA256(secret: string, message: string): Promise<string> {
  // Try Web Crypto first (Edge, browser, Deno, Bun, CF Workers)
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
    const enc = new TextEncoder();
    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await globalThis.crypto.subtle.sign("HMAC", key, enc.encode(message));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Fallback: Node.js crypto (only reached in older Node.js or restricted environments)
  try {
    const { createHmac } = await import("node:crypto");
    return createHmac("sha256", secret).update(message).digest("hex");
  } catch {
    throw new Error(
      "Acrossed SDK: No suitable crypto implementation found. " +
        "Ensure you are running in Node.js >= 18, or a runtime with Web Crypto support.",
    );
  }
}

// ── Client factory ─────────────────────────────────────────────────────────

export function createClient(options: AcrossedClientOptions) {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE).replace(/\/$/, "");
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 5000;

  async function generateSignedRequest(payload: CheckPayload): Promise<SignedRequest> {
    const body = JSON.stringify(payload);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await hmacSHA256(options.signingSecret, `${timestamp}.${body}`);
    return {
      url: `${baseUrl}/check`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Acrossed-Key": options.apiKey,
        "X-Acrossed-Timestamp": timestamp,
        "X-Acrossed-Signature": signature,
      },
      body,
    };
  }

  async function checkRequest(payload: CheckPayload): Promise<CheckResult> {
    const req = await generateSignedRequest(payload);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetchImpl(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
        signal: ctrl.signal,
      });
      const json = (await res.json()) as CheckResult;
      return json;
    } finally {
      clearTimeout(timer);
    }
  }

  async function checkHTTPRequest(req: {
    ip?: string;
    method?: string;
    path?: string;
    url?: string;
    headers?: Record<string, string> | Headers | { [key: string]: string | string[] | undefined };
    query?: Record<string, string>;
  }): Promise<CheckResult> {
    const headers: Record<string, string> = {};
    const rawHeaders = req.headers ?? {};
    if (rawHeaders instanceof Headers) {
      (rawHeaders as Headers).forEach((v: string, k: string) => {
        headers[k.toLowerCase()] = v;
      });
    } else {
      for (const [k, v] of Object.entries(rawHeaders)) {
        if (v !== undefined) headers[k.toLowerCase()] = Array.isArray(v) ? v[0] : String(v);
      }
    }
    const path = req.path ?? (req.url ? new URL(req.url, "http://x").pathname : "/");
    return checkRequest({ ip: req.ip, method: req.method, path, headers, query: req.query });
  }

  return { checkRequest, checkHTTPRequest, generateSignedRequest };
}

export type AcrossedClient = ReturnType<typeof createClient>;
