import Link from "next/link";
import { apiJson } from "@/lib/api";
import { RulesBuilder } from "@/components/RulesBuilder";
import { DomainCard } from "@/components/DomainCard";
import { LogSinkSection } from "@/components/LogSinkSection";
import { RiGlobalLine as Globe, RiFlashlightLine as Zap, RiPulseLine as Activity, RiShieldLine as Shield } from "@remixicon/react";
import { WebhookPanel } from "@/components/WebhookPanel";

interface PlanDetails {
  id: string;
  name: string;
  monthlyChecks: number;
  maxRules: number;
  maxCustomDomains: number;
}
interface CustomDomain {
  domain: string;
  verifiedAt: string | null;
  createdAt: string;
}
interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  plan: string;
  defaultUrl: string;
  planDetails: PlanDetails;
  rules: unknown[];
  customDomains: CustomDomain[];
}
interface Usage {
  monthlyChecks: number;
  monthlyCap: number;
  monthlyResetAt: number | null;
  requestCount: number;
  allowedCount: number;
  deniedCount: number;
}

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, usage] = await Promise.all([
    apiJson<ProjectDetail>(`/projects/${id}`),
    apiJson<Usage>(`/projects/${id}/usage`).catch(() => ({
      monthlyChecks: 0,
      monthlyCap: 10000,
      monthlyResetAt: null,
      requestCount: 0,
      allowedCount: 0,
      deniedCount: 0,
    })),
  ]);

  const pct = Math.min(100, Math.round((usage.monthlyChecks / Math.max(usage.monthlyCap, 1)) * 100));

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-2">Project</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{project.name}</h1>
          <p className="font-mono mt-1 break-all text-[11px] text-ink-low sm:text-xs">{project.id}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-mono rounded-full border border-line bg-bg-elev px-3 py-1 text-[10px] uppercase tracking-widest text-ink-mid">
            {project.plan}
          </span>
          <Link href="/dashboard/billing" className="btn btn-ghost text-xs sm:text-sm">
            Manage plan
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Monthly checks</p>
            <Activity className="h-4 w-4 text-brand" />
          </div>
          <p className="font-mono mt-3 text-2xl font-semibold sm:text-3xl">
            {usage.monthlyChecks.toLocaleString()}
            <span className="ml-2 text-sm font-normal text-ink-low">/ {usage.monthlyCap.toLocaleString()}</span>
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="surface p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Allowed</p>
            <Zap className="h-4 w-4 text-[color:var(--good)]" />
          </div>
          <p className="font-mono mt-3 text-2xl font-semibold sm:text-3xl">{usage.allowedCount.toLocaleString()}</p>
        </div>
        <div className="surface p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Denied</p>
            <Shield className="h-4 w-4 text-[color:var(--bad)]" />
          </div>
          <p className="font-mono mt-3 text-2xl font-semibold sm:text-3xl">{usage.deniedCount.toLocaleString()}</p>
        </div>
      </div>

      <div className="surface p-5 sm:p-6">
        <div className="flex items-center gap-2 text-ink-hi">
          <Globe className="h-4 w-4 text-brand" />
          <span className="text-sm font-medium">Default endpoint</span>
        </div>
        <a
          href={project.defaultUrl}
          target="_blank"
          rel="noopener"
          className="font-mono mt-2 block break-all text-sm text-brand hover:underline sm:text-base"
        >
          {project.defaultUrl}
        </a>
        <p className="mt-1 text-xs text-ink-low">
          Every project gets a free TLS-secured subdomain. Add a custom one below.
        </p>
      </div>

      <DomainCard
        projectId={project.id}
        plan={project.plan}
        maxDomains={project.planDetails.maxCustomDomains}
        domains={project.customDomains}
      />

      <LogSinkSection projectId={project.id} />

      <WebhookPanel />

      <RulesBuilder projectId={project.id} initial={project.rules} />
    </div>
  );
}
