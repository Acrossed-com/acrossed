"use client";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  plan: string;
}

export function UpgradeButton({ projects, planId }: { projects: Project[]; planId: string }) {
  const [picked, setPicked] = useState(projects[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/dashboard/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId: picked, plan: planId }),
      });
      const data = await r.json();
      if (!r.ok || !data.url) {
        setErr(data.error ?? "checkout failed");
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <select
        value={picked}
        onChange={(e) => setPicked(e.target.value)}
        className="w-full rounded-md border border-line bg-bg-base px-3 py-2 text-sm text-ink-hi focus:border-brand-line focus:outline-none"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.plan})
          </option>
        ))}
      </select>
      <button
        onClick={go}
        disabled={!picked || loading}
        className="btn btn-primary w-full justify-center disabled:opacity-50"
      >
        {loading ? "Redirecting…" : `Upgrade to ${planId}`}
      </button>
      {err && <p className="text-xs text-[color:var(--bad)]">{err}</p>}
    </div>
  );
}
