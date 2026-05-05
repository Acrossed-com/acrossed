import { NextResponse } from "next/server";
import { internalFetch } from "@/lib/internalApi";
import { requireAdmin, getCurrentUserId } from "@/lib/admin";

export async function GET() {
  const res = await fetch("http://127.0.0.1:4000/admin/domains", {
    headers: {
      "x-internal-secret": process.env.INTERNAL_SECRET ?? "",
    },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const userId = await getCurrentUserId();
  const body = await req.json();
  const res = await fetch("http://127.0.0.1:4000/admin/domains", {
    method: "POST",
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
