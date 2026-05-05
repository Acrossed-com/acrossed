import { requireAdmin } from "@/lib/admin";
import { internalFetch } from "@/lib/internalApi";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Detail {
  id: string; from: string; to: string; subject: string;
  date: string; messageId: string; body: string; rawSize: number;
}

function fromSafeId(safeId: string): string {
  // Decode base64url back to the original URL-encoded maildir ID
  return Buffer.from(safeId, "base64url").toString("utf8");
}

export default async function InboxMessage({ params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) redirect("/dashboard");
  const { id: safeId } = await params;

  // Decode the base64url ID back to the original maildir-encoded ID
  const originalId = fromSafeId(safeId);

  let m: Detail;
  try {
    m = await internalFetch<Detail>(`/admin/inbox/${originalId}`, { actingUserId: isAdmin.userId });
  } catch (e) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/admin/inbox" className="font-mono text-xs uppercase tracking-widest text-ink-mid hover:text-ink-hi">← Back to inbox</Link>
        <div className="surface p-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#EF6F6F]">Message not found</h1>
          <p className="mt-2 text-sm text-ink-mid">The email may have been moved or deleted.</p>
          <p className="mt-2 font-mono text-xs text-ink-low">Debug: {originalId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/admin/inbox" className="font-mono text-xs uppercase tracking-widest text-ink-mid hover:text-ink-hi">← Back to inbox</Link>
      <header className="surface p-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{m.subject}</h1>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-[max-content_1fr] sm:gap-x-6">
          <dt className="text-ink-mid">From</dt><dd className="text-ink-hi">{m.from}</dd>
          <dt className="text-ink-mid">To</dt><dd className="text-ink-hi">{m.to}</dd>
          <dt className="text-ink-mid">Date</dt><dd className="text-ink-hi">{m.date}</dd>
          {m.messageId && (<><dt className="text-ink-mid">Message-Id</dt><dd className="font-mono break-all text-xs text-ink-low">{m.messageId}</dd></>)}
          <dt className="text-ink-mid">Size</dt><dd className="font-mono text-xs text-ink-low">{(m.rawSize / 1024).toFixed(1)} KB</dd>
        </dl>
      </header>
      <pre className="surface whitespace-pre-wrap break-words p-6 font-mono text-sm leading-relaxed text-ink-hi">{m.body || "(empty body)"}</pre>
    </div>
  );
}
