// Catch-all for custom domains. middleware.ts rewrites unknown hosts here with
// the Host header preserved as `_host` query param. We resolve it through the
// API to find the owning project and render the same public page.
import { RiShieldLine as Shield } from "@remixicon/react";
import { notFound } from "next/navigation";

interface ProjectMeta {
  id: string;
  name: string;
  slug: string;
  plan: string;
  defaultUrl: string;
}

async function loadProjectByHost(host: string): Promise<ProjectMeta | null> {
  try {
    const r = await fetch(
      `${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000"}/domains/resolve?domain=${encodeURIComponent(host)}`,
      { cache: "no-store" }
    );
    if (!r.ok) return null;
    return (await r.json()) as ProjectMeta;
  } catch {
    return null;
  }
}

export default async function CustomHostPage({
  searchParams,
}: {
  searchParams: Promise<{ _host?: string }>;
}) {
  const { _host } = await searchParams;
  if (!_host) notFound();
  const project = await loadProjectByHost(_host);
  if (!project) notFound();

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.35),transparent_70%)] blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300 backdrop-blur">
          <Shield className="h-4 w-4" />
          Protected by Acrossed
        </div>
        <h1 className="mt-8 text-5xl font-semibold tracking-tight md:text-7xl">{project.name}</h1>
        <p className="mt-6 max-w-md text-zinc-400">
          Served from your custom domain <span className="font-mono text-zinc-300">{_host}</span> via
          the Acrossed edge. TLS by Let&apos;s Encrypt, on-demand.
        </p>
      </div>
    </main>
  );
}
