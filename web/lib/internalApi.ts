// Server-only fetch helper for talking to the Acrossed API over the internal
// secret channel. Used by /dashboard server components and route handlers.
import "server-only";

const INTERNAL_URL = process.env.INTERNAL_API_URL ?? process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? "";

interface Opts {
  method?: "GET" | "POST" | "DELETE" | "PUT";
  body?: unknown;
  /** When set, forwarded as X-Acting-Clerk-User-Id for the API to authorize. */
  actingUserId?: string;
}

export async function internalFetch<T>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = {
    "x-internal-secret": INTERNAL_SECRET,
    "content-type": "application/json",
  };
  if (opts.actingUserId) headers["x-acting-clerk-user-id"] = opts.actingUserId;

  const res = await fetch(`${INTERNAL_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`internalFetch ${path} -> ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}
