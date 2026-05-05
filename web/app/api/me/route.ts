import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ADMIN_IDS = new Set(
  (process.env.ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

export async function GET() {
  const { userId } = await auth();
  return NextResponse.json({ isAdmin: userId != null && ADMIN_IDS.has(userId) });
}
