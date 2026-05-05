// Public-facing page served at https://<slug>.acrsd.dev (and at the user's
// custom domain). Renders the "protected by Acrossed" status card. The actual
// path-routing from subdomain → /p/<slug> is handled in middleware.ts.
import { RiShieldLine as Shield } from "@remixicon/react";
import { notFound } from "next/navigation";

interface ProjectMeta {
  id: string;
  name: string;
  slug: string;
  plan: string;
  defaultUrl: string;
}

async function loadProjectBySlug(slug: string): Promise<ProjectMeta | null> {
  try {
    const r = await fetch(
      `${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000"}/domains/resolve?domain=${encodeURIComponent(`${slug}.acrsd.dev`)}`,
      { cache: "no-store" }
    );
    if (!r.ok) return null;
    return (await r.json()) as ProjectMeta;
  } catch {
    return null;
  }
}

export default async function ProjectPublic({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await loadProjectBySlug(slug);
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
        <h1 className="mt-8 text-5xl font-semibold tracking-tight md:text-7xl">
          {project.name}
        </h1>
        <p className="mt-6 max-w-md text-zinc-400">
          This endpoint is gated by the Acrossed rule engine. Every inbound request is
          cryptographically signed and evaluated in microseconds.
        </p>
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Default endpoint</p>
          <p className="mt-1 font-mono text-emerald-300">{project.defaultUrl}</p>
        </div>
        <a
          href="https://acrossed.com"
          className="mt-10 text-sm text-zinc-500 hover:text-zinc-300"
        >
          What is Acrossed? →
        </a>
      </div>
    </main>
  );
}
