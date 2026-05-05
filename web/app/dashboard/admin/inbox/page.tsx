import { requireAdmin, getCurrentUserId } from "@/lib/admin";
import { internalFetch } from "@/lib/internalApi";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Message {
  id: string; new: boolean; mtime: string;
  from: string; to: string; subject: string; date: string; preview: string;
}

function toSafeId(id: string): string {
  // Convert the URL-encoded maildir ID to a base64url-safe string for the link
  return Buffer.from(id).toString("base64url");
}

export default async function AdminInbox() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    const userId = await getCurrentUserId();
    return (
      <div className="mx-auto max-w-xl space-y-4 py-12 text-center">
        <h1 className="font-display text-2xl font-semibold">Admin only</h1>
        {userId && <p className="font-mono text-xs text-ink-low">{userId}</p>}
        <Link href="/dashboard" className="btn btn-ghost mx-auto inline-flex">← Back to dashboard</Link>
      </div>
    );
  }

  const data = await internalFetch<{ count: number; messages: Message[]; maildir: string }>(
    "/admin/inbox", { actingUserId: isAdmin.userId },
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow mb-2">Admin · Inbox</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">hi@acrossed.com</h1>
        <p className="mt-2 text-sm text-ink-mid">
          {data.count} message{data.count === 1 ? "" : "s"}. Mail is delivered by Postfix to a server-side maildir and read live.
        </p>
      </header>

      {data.messages.length === 0 ? (
        <div className="surface p-10 text-center">
          <p className="text-ink-mid">Inbox is empty. Send a test email to <span className="font-mono">hi@acrossed.com</span>.</p>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          {data.messages.map((m, i) => (
            <Link key={m.id} href={`/dashboard/admin/inbox/${toSafeId(m.id)}`}
              className={`block p-4 hover:bg-bg-elev transition-colors ${i > 0 ? "border-t border-line" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {m.new && <span className="font-mono rounded-full bg-brand/15 px-2 py-0.5 text-[9px] uppercase tracking-widest text-brand">new</span>}
                    <span className="truncate font-medium text-ink-hi">{m.from}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-ink-hi">{m.subject}</p>
                  <p className="mt-1 truncate text-xs text-ink-mid">{m.preview}</p>
                </div>
                <span className="font-mono whitespace-nowrap text-[10px] uppercase tracking-widest text-ink-low">
                  {new Date(m.mtime).toLocaleString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
