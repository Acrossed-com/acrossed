import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = await apiFetch(`/projects/${id}/log-sink`);
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const r = await apiFetch(`/projects/${id}/log-sink`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const r = await apiFetch(`/projects/${id}/log-sink`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = await apiFetch(`/projects/${id}/log-sink`, { method: "DELETE" });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
