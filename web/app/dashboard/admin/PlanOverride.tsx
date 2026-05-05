"use client";
import { useState, useTransition } from "react";

export function PlanOverride({ projectId, currentPlan }: { projectId: string; currentPlan: "free" | "pro" | "enterprise" }) {
  const [plan, setPlan] = useState(currentPlan);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function save(next: typeof plan) {
    setPlan(next);
    start(async () => {
      setMsg(null);
      const r = await fetch(`/dashboard/api/admin/projects/${projectId}/plan`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: next }),
      });
      setMsg(r.ok ? "saved" : "error");
      setTimeout(() => setMsg(null), 1500);
    });
  }

  return (
    <div className="inline-flex items-center gap-2">
      <select
        value={plan}
        disabled={pending}
        onChange={(e) => save(e.target.value as typeof plan)}
        className="font-mono rounded-md border border-line bg-bg-elev px-2 py-1 text-xs text-ink-hi focus:border-brand-line focus:outline-none"
      >
        <option value="free">free</option>
        <option value="pro">pro</option>
        <option value="enterprise">enterprise</option>
      </select>
      {msg && (
        <span className={`text-[10px] ${msg === "saved" ? "text-[color:var(--good)]" : "text-[color:var(--bad)]"}`}>
          {msg}
        </span>
      )}
    </div>
  );
}
