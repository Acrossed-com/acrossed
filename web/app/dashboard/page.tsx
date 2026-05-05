import Link from "next/link";
import { apiJson } from "@/lib/api";
import { NewProjectForm } from "@/components/NewProjectForm";

interface Project {
  id: string;
  name: string;
  slug: string;
  plan: string;
  defaultUrl: string;
  createdAt: string;
  updatedAt: string;
}

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const data = await apiJson<{ projects: Project[] }>("/projects");
  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Projects</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Your rule engines</h1>
          <p className="mt-2 text-sm text-ink-mid">Each project gets its own API key, signing secret, and acrsd.dev subdomain.</p>
        </div>
        <NewProjectForm />
      </header>

      {data.projects.length === 0 ? (
        <div className="surface p-10 text-center text-ink-mid">
          No projects yet. Create one to get an API key + signing secret.
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.projects.map((p) => (
            <li key={p.id}>
              <Link href={`/dashboard/projects/${p.id}`} className="block">
                <div className="surface p-5 transition-colors hover:border-brand-line">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-medium">{p.name}</h3>
                    <span className="font-mono rounded-full border border-line bg-bg-elev px-2 py-0.5 text-[10px] uppercase tracking-widest text-ink-mid">
                      {p.plan}
                    </span>
                  </div>
                  <p className="font-mono mt-3 truncate text-xs text-brand">{p.defaultUrl}</p>
                  <p className="font-mono mt-1 truncate text-[10px] text-ink-low">{p.id}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
