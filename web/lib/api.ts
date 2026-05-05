// Server-side helper: forwards dashboard calls to the internal Fastify API
// using the shared INTERNAL_SECRET so we don't pay a Clerk JWT round-trip.
import { auth } from "@clerk/nextjs/server";

const BASE = process.env.INTERNAL_API_URL ?? "http://localhost:4000";
const SECRET = process.env.INTERNAL_SECRET ?? "";

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { userId } = await auth();
  if (!userId) throw new Error("unauthenticated");
  const headers = new Headers(init.headers);
  headers.set("x-internal-secret", SECRET);
  headers.set("x-user-id", userId);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  return fetch(`${BASE}${path}`, { ...init, headers, cache: "no-store" });
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) throw new Error(`api ${path} -> ${res.status}`);
  return (await res.json()) as T;
}
