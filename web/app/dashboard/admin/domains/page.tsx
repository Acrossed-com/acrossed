"use client";
import { useState, useEffect } from "react";

interface Domain {
  id: string;
  domain: string;
  price: string;
  description: string;
  category: string;
  featured: boolean;
  status: "available" | "sold" | "reserved";
}

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [form, setForm] = useState({ domain: "", price: "Make offer", description: "", category: "", featured: false });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/dashboard/api/admin/domains");
    if (res.ok) setDomains(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.domain) return;
    const res = await fetch("/dashboard/api/admin/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ domain: "", price: "Make offer", description: "", category: "", featured: false });
      load();
    }
  };

  const remove = async (id: string) => {
    await fetch(`/dashboard/api/admin/domains/${id}`, { method: "DELETE" });
    load();
  };

  const toggleStatus = async (d: Domain) => {
    const next = d.status === "available" ? "sold" : d.status === "sold" ? "reserved" : "available";
    await fetch(`/dashboard/api/admin/domains/${d.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...d, status: next }),
    });
    load();
  };

  if (loading) return <div className="py-12 text-center text-ink-mid">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Domain Marketplace</h1>
        <p className="mt-1 text-sm text-ink-mid" style={{ fontFamily: "'Supreme', sans-serif" }}>
          Manage domain listings shown on /domains
        </p>
      </div>

      {/* Add domain form */}
      <div className="surface p-5 space-y-4">
        <p className="font-display text-sm font-semibold" style={{ color: "#ECEDEE" }}>Add Domain</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
            placeholder="example.com"
            className="rounded-lg border border-line bg-bg-elev px-3 py-2 text-sm text-ink-hi outline-none focus:border-brand"
          />
          <input
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="$999 or Make offer"
            className="rounded-lg border border-line bg-bg-elev px-3 py-2 text-sm text-ink-hi outline-none focus:border-brand"
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short description"
            className="rounded-lg border border-line bg-bg-elev px-3 py-2 text-sm text-ink-hi outline-none focus:border-brand"
          />
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Category (e.g. SaaS, Dev Tools)"
            className="rounded-lg border border-line bg-bg-elev px-3 py-2 text-sm text-ink-hi outline-none focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-ink-mid cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="accent-[#6E8BFF]"
            />
            Featured
          </label>
          <button onClick={add} className="btn btn-primary text-xs">Add Domain</button>
        </div>
      </div>

      {/* Domain list */}
      <div className="space-y-3">
        {domains.map((d) => (
          <div key={d.id} className="surface flex items-center justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold" style={{ color: "#ECEDEE" }}>{d.domain}</span>
                {d.featured && <span className="font-mono text-[10px] text-brand">FEATURED</span>}
                <span className={`font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
                  d.status === "available" ? "text-[#4ADE80] border border-[rgba(74,222,128,0.2)]" :
                  d.status === "sold" ? "text-[#EF6F6F] border border-[rgba(239,111,111,0.2)]" :
                  "text-[#FBBF24] border border-[rgba(251,191,36,0.2)]"
                }`}>{d.status}</span>
              </div>
              <p className="mt-1 text-xs text-ink-low truncate">{d.description || "No description"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-ink-mid">{d.price}</span>
              <button onClick={() => toggleStatus(d)} className="btn btn-ghost text-[10px] py-1 px-2">Toggle</button>
              <button onClick={() => remove(d.id)} className="btn btn-ghost text-[10px] py-1 px-2 text-[#EF6F6F] border-[rgba(239,111,111,0.2)]">Delete</button>
            </div>
          </div>
        ))}
        {domains.length === 0 && (
          <div className="surface p-8 text-center text-ink-low text-sm">No domains listed yet. Add one above.</div>
        )}
      </div>
    </div>
  );
}