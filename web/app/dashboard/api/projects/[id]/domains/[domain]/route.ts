import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; domain: string }> }
) {
  const { id, domain } = await ctx.params;
  const r = await apiFetch(`/projects/${id}/domains/${encodeURIComponent(domain)}`, {
    method: "DELETE",
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
