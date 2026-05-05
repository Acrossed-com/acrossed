import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { internalFetch } from "@/lib/internalApi";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.plan !== "string") return NextResponse.json({ error: "bad_body" }, { status: 400 });

  try {
    const result = await internalFetch<{ ok: true; plan: string }>(`/admin/projects/${id}/plan`, {
      method: "POST",
      body: { plan: body.plan },
      actingUserId: admin.userId,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
