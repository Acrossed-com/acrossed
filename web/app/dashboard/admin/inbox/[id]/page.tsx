import { requireAdmin } from "@/lib/admin";
import { internalFetch } from "@/lib/internalApi";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Detail {
  id: string; from: string; to: string; subject: string;
  date: string; messageId: string; body: string; rawSize: number;
}

export default async function InboxMessage({ params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) redirect("/dashboard");
  const { id } = await params;
  const m = await internalFetch<Detail>(`/admin/inbox/${id}`, { actingUserId: isAdmin.userId });

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
        </dl>
      </header>
      <pre className="surface whitespace-pre-wrap break-words p-6 font-mono text-sm leading-relaxed text-ink-hi">{m.body || "(empty body)"}</pre>
    </div>
  );
}
