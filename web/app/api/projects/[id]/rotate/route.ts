import { apiFetch } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await apiFetch(`/projects/${id}/rotate`, { method: "POST" });
  return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
}
