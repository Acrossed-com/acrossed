import { requireAdmin, getCurrentUserId } from "@/lib/admin";
import { internalFetch } from "@/lib/internalApi";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface TableInfo {
  columns: { column_name: string; data_type: string; is_nullable: string }[];
  rows: Record<string, unknown>[];
  count: number;
}

export default async function AdminDbPage() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-12 text-center">
        <h1 className="font-display text-2xl font-semibold">Admin only</h1>
        <Link href="/dashboard" className="btn btn-ghost mx-auto inline-flex">← Back to dashboard</Link>
      </div>
    );
  }

  const data = await internalFetch<{ tables: Record<string, TableInfo> }>(
    "/admin/db", { actingUserId: isAdmin.userId },
  );

  const tables = data.tables;

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow mb-2">Admin · Database</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Database Explorer</h1>
        <p className="mt-2 text-sm text-ink-mid">PostgreSQL · localhost:5432 · acrossed</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {Object.entries(tables).map(([name, info]) => (
          <a key={name} href={`#${name}`} className="surface p-4 transition-colors hover:border-brand-line">
            <p className="font-mono text-sm font-medium text-ink-hi">{name}</p>
            <p className="font-mono mt-1 text-xs text-ink-low">{info.count} rows · {info.columns.length} cols</p>
          </a>
        ))}
      </div>

      {Object.entries(tables).map(([name, info]) => (
        <section key={name} id={name} className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-lg font-semibold">{name}</h2>
            <span className="font-mono text-xs text-ink-low">{info.count} rows</span>
          </div>

          {/* Schema */}
          <div className="surface overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-bg-elev text-left text-ink-low">
                <tr>
                  <th className="px-3 py-2 font-medium uppercase tracking-wider">Column</th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wider">Type</th>
                  <th className="px-3 py-2 font-medium uppercase tracking-wider">Nullable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {info.columns.map((col) => (
                  <tr key={col.column_name} className="bg-bg-base">
                    <td className="px-3 py-2 font-mono text-ink-hi">{col.column_name}</td>
                    <td className="px-3 py-2 font-mono text-brand">{col.data_type}</td>
                    <td className="px-3 py-2 font-mono text-ink-low">{col.is_nullable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Data (last 20 rows) */}
          {info.rows.length > 0 && (
            <div className="surface overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-bg-elev text-left text-ink-low">
                  <tr>
                    {info.columns.map((col) => (
                      <th key={col.column_name} className="px-3 py-2 font-medium uppercase tracking-wider whitespace-nowrap">
                        {col.column_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {info.rows.map((row, i) => (
                    <tr key={i} className="bg-bg-base">
                      {info.columns.map((col) => (
                        <td key={col.column_name} className="px-3 py-2 font-mono text-ink-hi max-w-[200px] truncate" title={String(row[col.column_name] ?? "")}>
                          {row[col.column_name] === null ? <span className="text-ink-low">null</span> : String(row[col.column_name]).slice(0, 100)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
