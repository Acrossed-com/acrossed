import Link from "next/link";
import { apiJson } from "@/lib/api";
import { RiCheckLine as Check } from "@remixicon/react";
import { UpgradeButton } from "@/components/UpgradeButton";

interface Plan {
  id: string;
  name: string;
  tagline?: string;
  priceUsdMonthly: number;
  monthlyChecks: number;
  maxRules: number;
  maxCustomDomains: number;
  features: string[];
}
interface Project {
  id: string;
  name: string;
  plan: string;
}

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const [{ plans }, { projects }] = await Promise.all([
    apiJson<{ plans: Plan[] }>("/billing/plans"),
    apiJson<{ projects: Project[] }>("/projects"),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow mb-2">Billing</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Plans &amp; usage</h1>
        <p className="mt-2 text-sm text-ink-mid">
          Each project keeps its own plan, quota, and limits. Upgrade or downgrade per-project.
        </p>
      </header>

      {projects.length === 0 ? (
        <div className="surface p-8 text-center">
          <p className="text-ink-mid">You don&apos;t have any projects yet.</p>
          <Link href="/dashboard" className="btn btn-primary mt-4 inline-flex">
            Create a project →
          </Link>
        </div>
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-ink-mid">Your projects</h2>
          <div className="surface overflow-hidden">
            {projects.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between p-5 ${i > 0 ? "border-t border-line" : ""}`}>
                <div>
                  <p className="font-medium text-ink-hi">{p.name}</p>
                  <p className="font-mono text-xs text-ink-low">{p.id}</p>
                </div>
                <span className="font-mono rounded-full border border-line bg-bg-elev px-3 py-1 text-[10px] uppercase tracking-widest text-ink-mid">
                  {p.plan}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-ink-mid">Available plans</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map((p) => {
            const highlight = p.id === "pro";
            return (
              <div
                key={p.id}
                className={`rounded-xl border p-6 ${highlight ? "border-brand-line bg-brand-soft" : "border-line bg-bg-elev"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-semibold">{p.name}</p>
                  {highlight && (
                    <span className="font-mono rounded-full border border-brand-line bg-brand-soft px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand">
                      Popular
                    </span>
                  )}
                </div>
                {p.tagline && <p className="mt-1 text-xs text-ink-mid">{p.tagline}</p>}
                <p className="font-display mt-4 text-3xl font-semibold tracking-tight">
                  ${p.priceUsdMonthly}
                  <span className="ml-1 text-sm font-normal text-ink-low">/mo</span>
                </p>
                <ul className="mt-5 space-y-2 text-sm text-ink-hi">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-brand" strokeWidth={2} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {p.id === "free" ? (
                    <p className="text-center text-xs text-ink-low">Default for every project</p>
                  ) : projects.length === 0 ? (
                    <p className="text-center text-xs text-ink-low">Create a project first</p>
                  ) : (
                    <UpgradeButton projects={projects} planId={p.id} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
