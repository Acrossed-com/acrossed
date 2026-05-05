import { NextRequest } from "next/server";
import { apiFetch } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await apiFetch(`/projects/${id}/rules`, { method: "PUT", body: await req.text() });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
}
