import { NextRequest } from "next/server";
import { apiFetch } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const r = await apiFetch("/projects");
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
}

export async function POST(req: NextRequest) {
  const r = await apiFetch("/projects", { method: "POST", body: await req.text() });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
}
