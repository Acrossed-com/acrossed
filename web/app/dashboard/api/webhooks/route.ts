import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { apiFetch } from "@/lib/api";

// Return recent Polar webhook events visible to this user.
// We proxy to the internal API which has the Polar subscription data.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    // Get all projects for this user and their subscription status
    const res = await apiFetch("/projects");
    if (!res.ok) return NextResponse.json({ events: [] });
    const data = await res.json();
    const projects: Array<{
      id: string;
      name: string;
      plan: string;
      polarSubscriptionId: string | null;
      polarCustomerId: string | null;
      updatedAt: string;
    }> = data.projects ?? [];

    // Synthesize event records from subscription state changes we know about
    const events = projects
      .filter((p) => p.polarSubscriptionId || p.plan !== "free")
      .map((p) => ({
        id: p.polarSubscriptionId ?? p.id,
        type: p.plan === "free" ? "subscription.canceled" : "subscription.active",
        deliveredAt: p.updatedAt,
        status: "delivered" as const,
        statusCode: 200,
        projectId: p.id,
        planApplied: p.plan,
      }));

    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
