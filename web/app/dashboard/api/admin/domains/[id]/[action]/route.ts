import { NextResponse } from "next/server";
import { requireAdmin, getCurrentUserId } from "@/lib/admin";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const userId = await getCurrentUserId();

  // Determine action from URL path
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/");
  const action = pathParts[pathParts.length - 1]; // "verify", "regenerate", or "social"

  const res = await fetch(`http://127.0.0.1:4000/admin/domains/${id}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.INTERNAL_SECRET ?? "",
      "x-acting-clerk-user-id": userId ?? "",
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
