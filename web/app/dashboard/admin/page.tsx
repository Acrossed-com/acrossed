import Link from "next/link";
import { requireAdmin, getCurrentUserId } from "@/lib/admin";
import { internalFetch } from "@/lib/internalApi";
import { PlanOverride } from "./PlanOverride";

export const dynamic = "force-dynamic";

interface Stats {
  projects: number;
  customDomains: number;
  planBreakdown: { free: number; pro: number; enterprise: number };
  usage: { totalRequests: number; totalAllowed: number; totalDenied: number; monthlyTotal: number };
}

interface ProjectRow {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: string;
  monthlyChecks: number;
  totalRequests: number;
  totalDenied: number;
  cap: number;
}

export default async function AdminPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    const userId = await getCurrentUserId();
    return (
      <div className="mx-auto max-w-xl space-y-4 py-12 text-center">
        <h1 className="font-display text-2xl font-semibold">Admin only</h1>
        <p className="text-ink-mid">
          This area is restricted to platform administrators.
        </p>
        {userId && (
          <div className="surface mx-auto max-w-md p-5 text-left">
            <p className="font-mono text-xs text-ink-low">Your Clerk user ID:</p>
            <p className="font-mono mt-1 break-all text-sm text-ink-hi">{userId}</p>
            <p className="mt-3 text-xs text-ink-mid">
              Add this ID to <code className="rounded bg-white/5 px-1.5 py-0.5">ADMIN_CLERK_USER_IDS</code>{" "}
              in your API environment, then restart the API process.
            </p>
          </div>
        )}
        <Link href="/dashboard" className="btn btn-ghost mx-auto inline-flex">← Back to dashboard</Link>
      </div>
    );
  }

  const [stats, projects] = await Promise.all([
    internalFetch<Stats>("/admin/stats", { actingUserId: isAdmin.userId }),
    internalFetch<{ projects: ProjectRow[] }>("/admin/projects", { actingUserId: isAdmin.userId }),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow mb-2">Admin</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Platform overview</h1>
        <p className="mt-2 text-ink-mid">Live aggregates across every project on the platform.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat k={fmt(stats.projects)} v="Projects" />
        <Stat k={fmt(stats.customDomains)} v="Custom domains" />
        <Stat k={fmt(stats.usage.monthlyTotal)} v="Decisions this month" />
        <Stat k={fmt(stats.usage.totalDenied)} v="Lifetime denied" />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <PlanCard label="Free" count={stats.planBreakdown.free} />
        <PlanCard label="Pro" count={stats.planBreakdown.pro} />
        <PlanCard label="Enterprise" count={stats.planBreakdown.enterprise} />
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">Projects ({projects.projects.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-bg-elev text-left text-ink-low">
              <tr>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Project</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">This month</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Lifetime</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-right">Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {projects.projects.map((p) => {
                const pct = p.cap > 0 ? Math.min(100, Math.round((p.monthlyChecks / p.cap) * 100)) : 0;
                return (
                  <tr key={p.id} className="bg-bg-base align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium text-ink-hi">{p.name}</div>
                      <div className="font-mono mt-0.5 text-[10px] text-ink-low">
                        {p.slug}.acrsd.dev · {p.ownerId}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-line bg-bg-elev px-2 py-0.5 text-[10px] uppercase tracking-widest text-ink-mid">
                        {p.plan}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-mono text-ink-hi">{fmt(p.monthlyChecks)}</div>
                      <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-line">
                        <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="font-mono mt-1 text-[10px] text-ink-low">{pct}% of {fmt(p.cap)}</div>
                    </td>
                    <td className="px-4 py-4 font-mono text-ink-mid">
                      {fmt(p.totalRequests)}
                      <div className="font-mono text-[10px] text-ink-low">{fmt(p.totalDenied)} denied</div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-ink-low">{p.createdAt.slice(0, 10)}</td>
                    <td className="px-4 py-4 text-right">
                      <PlanOverride projectId={p.id} currentPlan={p.plan} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="surface p-5">
      <div className="font-display text-2xl font-semibold">{k}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-ink-low">{v}</div>
    </div>
  );
}

function PlanCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="surface flex items-baseline justify-between p-5">
      <div className="font-display text-lg font-semibold">{label}</div>
      <div className="font-mono text-xl text-ink-hi">{fmt(count)}</div>
    </div>
  );
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
