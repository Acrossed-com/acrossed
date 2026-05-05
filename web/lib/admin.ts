// Server-only admin gating: parses ADMIN_CLERK_USER_IDS (csv) and checks the
// caller against it. The admin pages call this in their server component to
// gate render. The internal /admin/* API also re-verifies.
import "server-only";
import { auth } from "@clerk/nextjs/server";

const ADMIN_IDS = new Set(
  (process.env.ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

export async function requireAdmin(): Promise<{ userId: string } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  if (!ADMIN_IDS.has(userId)) return null;
  return { userId };
}

/** Returns the caller's Clerk user ID even if they're not an admin —
 *  used so we can show a "your ID is X, ask the maintainer to add it" hint. */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}
