import { NextResponse } from "next/server";
import { requireAdmin, getCurrentUserId } from "@/lib/admin";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const userId = await getCurrentUserId();
  const body = await req.json();
  const res = await fetch(`http://127.0.0.1:4000/admin/domains/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.INTERNAL_SECRET ?? "",
      "x-acting-clerk-user-id": userId ?? "",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const userId = await getCurrentUserId();
  const res = await fetch(`http://127.0.0.1:4000/admin/domains/${id}`, {
    method: "DELETE",
    headers: {
      "x-internal-secret": process.env.INTERNAL_SECRET ?? "",
      "x-acting-clerk-user-id": userId ?? "",
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
