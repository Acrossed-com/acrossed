import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const r = await apiFetch(`/projects/${id}/log-sink/test`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
