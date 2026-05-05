import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const r = await apiFetch("/billing/portal", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
