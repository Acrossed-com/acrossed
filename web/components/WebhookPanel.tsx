"use client";
import { useEffect, useState } from "react";
import { RiCheckboxCircleLine as CheckCircle2, RiCloseCircleLine as XCircle, RiRefreshLine as RefreshCw, RiLoader4Line as Loader2, RiBroadcastLine as Webhook, RiInformationLine as Info } from "@remixicon/react";
interface WebhookEvent {
  id: string;
  type: string;
  deliveredAt: string | null;
  status: "delivered" | "failed" | "pending";
  statusCode: number | null;
  projectId: string | null;
  planApplied: string | null;
}

export function WebhookPanel() {
  const [events, setEvents] = useState<WebhookEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/dashboard/api/webhooks");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Webhook className="mt-0.5 h-4 w-4 text-brand" />
          <div>
            <h3 className="text-sm font-medium text-ink-hi">Webhook delivery</h3>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink-low">
              Billing webhooks are delivered by Polar when your subscription changes. Each event
              triggers a plan update in the Acrossed engine immediately — no restart required.
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn btn-ghost inline-flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mt-5">
        {loading && !events ? (
          <div className="flex items-center gap-2 text-sm text-ink-low">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading webhook history…
          </div>
        ) : error ? (
          <div className="rounded-lg border border-[color:var(--bad)]/30 bg-[color:var(--bad)]/5 p-4 text-xs text-[color:var(--bad)]">
            {error}
          </div>
        ) : !events || events.length === 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-line bg-bg-elev/50 p-4 text-xs text-ink-low">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
            <span>
              No webhook events yet. Events appear here when Polar delivers billing
              notifications (plan upgrades, downgrades, renewals).
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line">
                  <th className="pb-2 text-left font-medium uppercase tracking-widest text-ink-low pr-4">Status</th>
                  <th className="pb-2 text-left font-medium uppercase tracking-widest text-ink-low pr-4">Event</th>
                  <th className="pb-2 text-left font-medium uppercase tracking-widest text-ink-low pr-4">Plan applied</th>
                  <th className="pb-2 text-left font-medium uppercase tracking-widest text-ink-low pr-4">Delivered</th>
                  <th className="pb-2 text-left font-medium uppercase tracking-widest text-ink-low">HTTP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {events.map((ev) => (
                  <tr key={ev.id} className="group">
                    <td className="py-3 pr-4">
                      {ev.status === "delivered" ? (
                        <span className="flex items-center gap-1 text-[color:var(--good)]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> OK
                        </span>
                      ) : ev.status === "failed" ? (
                        <span className="flex items-center gap-1 text-[color:var(--bad)]">
                          <XCircle className="h-3.5 w-3.5" /> Failed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-ink-low">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-mono text-ink-hi">{ev.type}</td>
                    <td className="py-3 pr-4">
                      {ev.planApplied ? (
                        <span className="font-mono rounded-full border border-line bg-bg-elev px-2 py-0.5 text-[10px] uppercase tracking-widest text-ink-mid">
                          {ev.planApplied}
                        </span>
                      ) : (
                        <span className="text-ink-low">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-ink-mid">
                      {ev.deliveredAt
                        ? new Date(ev.deliveredAt).toLocaleString()
                        : <span className="text-ink-low">—</span>}
                    </td>
                    <td className="py-3 font-mono text-ink-mid">
                      {ev.statusCode ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-lg border border-line bg-bg-elev/40 p-4 text-xs text-ink-low leading-relaxed">
        <p className="font-medium text-ink-mid mb-1">How billing webhooks work</p>
        <p>
          When you upgrade to Pro or Enterprise, Polar sends a{" "}
          <code className="font-mono rounded bg-white/5 px-1 py-0.5">subscription.active</code> event
          to our API. We verify the HMAC-SHA256 signature, look up your project, and immediately update
          your plan in both the database and the in-memory rule engine — no restart, no propagation delay.
          Downgrades and cancellations are handled the same way via{" "}
          <code className="font-mono rounded bg-white/5 px-1 py-0.5">subscription.canceled</code>.
        </p>
      </div>
    </div>
  );
}
