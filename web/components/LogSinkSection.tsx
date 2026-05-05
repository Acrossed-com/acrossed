"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RiDatabase2Line as Database, RiErrorWarningLine as AlertCircle, RiCheckboxCircleLine as CheckCircle2, RiDeleteBin6Line as Trash2, RiLoader4Line as Loader2 } from "@remixicon/react";
interface SinkConfig {
  configured: boolean;
  enabled: boolean;
  active: boolean;
  table: string;
  display: string | null;
  host: string | null;
  database: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
}

export function LogSinkSection({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [cfg, setCfg] = useState<SinkConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [table, setTable] = useState("acrossed_decisions");
  const [busy, setBusy] = useState<null | "test" | "save" | "delete" | "toggle">(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/dashboard/api/projects/${projectId}/log-sink`, { cache: "no-store" });
        const data = (await res.json()) as SinkConfig;
        if (!cancelled) {
          setCfg(data);
          if (data.table) setTable(data.table);
        }
      } catch {
        // ignore — render the empty form
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function refetch() {
    const res = await fetch(`/dashboard/api/projects/${projectId}/log-sink`, { cache: "no-store" });
    const data = (await res.json()) as SinkConfig;
    setCfg(data);
    if (data.table) setTable(data.table);
  }

  async function onTest() {
    if (!url.trim()) return;
    setBusy("test");
    setFeedback(null);
    try {
      const res = await fetch(`/dashboard/api/projects/${projectId}/log-sink/test`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim(), table: table.trim() || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedback({ kind: "ok", msg: "Connection ok. Table is ready to receive rows." });
      } else {
        setFeedback({ kind: "err", msg: data.error || "Connection failed." });
      }
    } catch (e) {
      setFeedback({ kind: "err", msg: e instanceof Error ? e.message : "Network error." });
    } finally {
      setBusy(null);
    }
  }

  async function onSave() {
    if (!url.trim()) return;
    setBusy("save");
    setFeedback(null);
    try {
      const res = await fetch(`/dashboard/api/projects/${projectId}/log-sink`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim(), table: table.trim() || undefined, enabled: true }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedback({ kind: "ok", msg: "Saved. Decisions are now logging to your DB." });
        setUrl("");
        await refetch();
        startTransition(() => router.refresh());
      } else {
        setFeedback({ kind: "err", msg: data.error || `Failed (${res.status}).` });
      }
    } catch (e) {
      setFeedback({ kind: "err", msg: e instanceof Error ? e.message : "Network error." });
    } finally {
      setBusy(null);
    }
  }

  async function onToggle(next: boolean) {
    setBusy("toggle");
    setFeedback(null);
    try {
      const res = await fetch(`/dashboard/api/projects/${projectId}/log-sink`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        await refetch();
      } else {
        setFeedback({ kind: "err", msg: data.error || `Failed (${res.status}).` });
      }
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    if (!confirm("Remove the BYO log sink? Existing rows in your DB are kept.")) return;
    setBusy("delete");
    setFeedback(null);
    try {
      const res = await fetch(`/dashboard/api/projects/${projectId}/log-sink`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refetch();
        startTransition(() => router.refresh());
      } else {
        setFeedback({ kind: "err", msg: `Failed (${res.status}).` });
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Database className="mt-0.5 h-4 w-4 text-brand" />
          <div>
            <h3 className="text-sm font-medium text-ink-hi">Decision logs (bring your own DB)</h3>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink-low">
              By default we don't store any per-request data. Plug in a Postgres connection string
              and we'll INSERT one row per decision into your database — asynchronously, off the
              hot path. The URL is encrypted at rest with AES-256-GCM.
            </p>
          </div>
        </div>
        {cfg?.configured && (
          <span
            className={`font-mono shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
              cfg.enabled
                ? "border-[color:var(--good)]/40 bg-[color:var(--good)]/10 text-[color:var(--good)]"
                : "border-line bg-bg-elev text-ink-mid"
            }`}
          >
            {cfg.enabled ? "Active" : "Paused"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-ink-low">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading current configuration…
        </div>
      ) : cfg?.configured ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 rounded-lg border border-line bg-bg-elev/50 p-4 text-sm sm:grid-cols-2">
            <Field label="Connection">
              <span className="font-mono break-all text-ink-hi">{cfg.display}</span>
            </Field>
            <Field label="Table">
              <span className="font-mono text-ink-hi">{cfg.table}</span>
            </Field>
            {cfg.host && (
              <Field label="Host">
                <span className="font-mono text-ink-hi">{cfg.host}</span>
              </Field>
            )}
            {cfg.database && (
              <Field label="Database">
                <span className="font-mono text-ink-hi">{cfg.database}</span>
              </Field>
            )}
          </div>

          {cfg.lastError && (
            <div className="flex items-start gap-2 rounded-lg border border-[color:var(--bad)]/30 bg-[color:var(--bad)]/5 p-3 text-xs text-[color:var(--bad)]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">Last write failed</p>
                <p className="mt-0.5 break-words text-[color:var(--bad)]/80">{cfg.lastError}</p>
                {cfg.lastErrorAt && (
                  <p className="mt-1 text-[10px] text-ink-low">at {new Date(cfg.lastErrorAt).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onToggle(!cfg.enabled)}
              disabled={busy !== null || pending}
              className="btn btn-ghost"
            >
              {cfg.enabled ? "Pause logging" : "Resume logging"}
            </button>
            <button
              onClick={onDelete}
              disabled={busy !== null || pending}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-xs text-ink-mid transition-colors hover:border-[color:var(--bad)]/40 hover:text-[color:var(--bad)]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : null}

      {/* Add / replace form */}
      <div className="mt-6 rounded-lg border border-line bg-bg-elev/40 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-low">
          {cfg?.configured ? "Replace connection" : "Connect a Postgres database"}
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-ink-mid">Connection string</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="password"
              autoComplete="off"
              placeholder="postgresql://user:password@host:5432/dbname"
              className="font-mono mt-1.5 w-full rounded-md border border-line bg-bg-base px-3 py-2 text-xs text-ink-hi placeholder:text-ink-low focus:border-brand-line focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-ink-low">
              Works with Neon, Supabase, RDS, or self-hosted. SSL is auto-detected.
            </p>
          </div>
          <div>
            <label className="block text-xs text-ink-mid">Table name</label>
            <input
              value={table}
              onChange={(e) => setTable(e.target.value)}
              placeholder="acrossed_decisions"
              className="font-mono mt-1.5 w-full rounded-md border border-line bg-bg-base px-3 py-2 text-xs text-ink-hi placeholder:text-ink-low focus:border-brand-line focus:outline-none sm:max-w-xs"
            />
            <p className="mt-1 text-[10px] text-ink-low">
              Lowercase letters, digits, underscores. We'll create it on first use if it doesn't exist.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onTest}
              disabled={!url.trim() || busy !== null}
              className="btn btn-ghost"
            >
              {busy === "test" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Test connection
            </button>
            <button
              onClick={onSave}
              disabled={!url.trim() || busy !== null}
              className="btn btn-primary"
            >
              {busy === "save" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {cfg?.configured ? "Replace and enable" : "Save and enable"}
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-md border p-3 text-xs ${
              feedback.kind === "ok"
                ? "border-[color:var(--good)]/30 bg-[color:var(--good)]/5 text-[color:var(--good)]"
                : "border-[color:var(--bad)]/30 bg-[color:var(--bad)]/5 text-[color:var(--bad)]"
            }`}
          >
            {feedback.kind === "ok" ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <span className="min-w-0 break-words">{feedback.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-widest text-ink-low">{label}</div>
      <div className="mt-1 min-w-0 truncate text-sm">{children}</div>
    </div>
  );
}
