"use client";
import { useState, useEffect } from "react";

interface Domain {
  id: string;
  domain: string;
  slug: string;
  price: string;
  description: string;
  category: string;
  featured: boolean;
  status: "available" | "sold" | "reserved";
  verified: boolean;
  landing_headline: string;
  landing_tagline: string;
  landing_description: string;
  landing_color_primary: string;
  landing_font: string;
  landing_use_cases: string[];
  landing_industry: string;
  contact_email: string;
}

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [form, setForm] = useState({ domain: "", price: "Make offer", description: "", category: "", featured: false, contact_email: "forsale@acrossed.com" });
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [socialModal, setSocialModal] = useState<{ domain: string; headline: string; subtitle: string; hashtags: string[]; caption: string } | null>(null);

  const load = async () => {
    const res = await fetch("/dashboard/api/admin/domains");
    if (res.ok) setDomains(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.domain) return;
    setLoading(true);
    const res = await fetch("/dashboard/api/admin/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ domain: "", price: "Make offer", description: "", category: "", featured: false, contact_email: "forsale@acrossed.com" });
      await load();
    }
    setLoading(false);
  };

  const remove = async (id: string) => {
    await fetch(`/dashboard/api/admin/domains/${id}`, { method: "DELETE" });
    load();
  };

  const verify = async (id: string) => {
    setVerifying(id);
    const res = await fetch(`/dashboard/api/admin/domains/${id}/verify`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      alert(data.verified
        ? `✅ Verified! NS: ${data.actual.join(", ")}`
        : `❌ Not verified yet. Expected: ${data.expected.join(", ")}. Got: ${data.actual.join(", ") || "none"}`
      );
      load();
    }
    setVerifying(null);
  };

  const regenerate = async (id: string) => {
    setRegenerating(id);
    await fetch(`/dashboard/api/admin/domains/${id}/regenerate`, { method: "POST" });
    await load();
    setRegenerating(null);
  };

  const generateSocial = async (id: string) => {
    const res = await fetch(`/dashboard/api/admin/domains/${id}/social`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setSocialModal(data);
    }
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

  if (loading && domains.length === 0) return <div className="py-12 text-center text-ink-mid">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-2">Admin · Domains</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Domain Marketplace</h1>
        <p className="mt-1 text-sm text-ink-mid" style={{ fontFamily: "'Supreme', sans-serif" }}>
          Manage domain listings. Point nameservers to <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">forsale1.dnserver.cloud</code> &amp; <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">forsale2.dnserver.cloud</code>, then verify.
        </p>
      </div>

      {/* Add domain form */}
      <div className="surface p-5 space-y-4">
        <p className="font-display text-sm font-semibold" style={{ color: "#ECEDEE" }}>Add Domain</p>
        <p className="text-xs text-ink-low">AI will automatically generate a landing page, description, and branding for the domain.</p>
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
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Category (e.g. SaaS, Dev Tools, AI)"
            className="rounded-lg border border-line bg-bg-elev px-3 py-2 text-sm text-ink-hi outline-none focus:border-brand"
          />
          <input
            value={form.contact_email}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            placeholder="Contact email"
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
          <button onClick={add} disabled={loading} className="btn btn-primary text-xs">
            {loading ? "Adding + AI generating..." : "Add Domain"}
          </button>
        </div>
      </div>

      {/* Domain list */}
      <div className="space-y-3">
        {domains.map((d) => (
          <div key={d.id} className="surface p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-sm font-semibold" style={{ color: "#ECEDEE" }}>{d.domain}</span>
                  {d.verified && <span className="font-mono text-[10px] text-[#4ADE80] border border-[rgba(74,222,128,0.2)] px-1.5 py-0.5 rounded">✓ VERIFIED</span>}
                  {!d.verified && <span className="font-mono text-[10px] text-[#FBBF24] border border-[rgba(251,191,36,0.2)] px-1.5 py-0.5 rounded">UNVERIFIED</span>}
                  {d.featured && <span className="font-mono text-[10px] text-brand">FEATURED</span>}
                  <span className={`font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    d.status === "available" ? "text-[#4ADE80] border border-[rgba(74,222,128,0.2)]" :
                    d.status === "sold" ? "text-[#EF6F6F] border border-[rgba(239,111,111,0.2)]" :
                    "text-[#FBBF24] border border-[rgba(251,191,36,0.2)]"
                  }`}>{d.status}</span>
                </div>
                <p className="mt-1 text-xs text-ink-low">{d.landing_headline || d.description || "No description"}</p>
                <p className="mt-0.5 font-mono text-[10px] text-ink-low">
                  Landing: /domains/{d.slug} · Font: {d.landing_font} · Color: {d.landing_color_primary}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                <span className="font-mono text-sm text-ink-mid">{d.price}</span>
                <button onClick={() => verify(d.id)} disabled={verifying === d.id} className="btn btn-ghost text-[10px] py-1 px-2">
                  {verifying === d.id ? "Checking..." : "Verify NS"}
                </button>
                <button onClick={() => regenerate(d.id)} disabled={regenerating === d.id} className="btn btn-ghost text-[10px] py-1 px-2">
                  {regenerating === d.id ? "AI..." : "Regen AI"}
                </button>
                <button onClick={() => generateSocial(d.id)} className="btn btn-ghost text-[10px] py-1 px-2" style={{ color: "#6E8BFF" }}>Social</button>
                <button onClick={() => toggleStatus(d)} className="btn btn-ghost text-[10px] py-1 px-2">Toggle</button>
                <a href={`/domains/${d.slug}`} target="_blank" rel="noopener" className="btn btn-ghost text-[10px] py-1 px-2" style={{ color: "#4ADE80" }}>View</a>
                <button onClick={() => remove(d.id)} className="btn btn-ghost text-[10px] py-1 px-2 text-[#EF6F6F]">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {domains.length === 0 && (
          <div className="surface p-8 text-center text-ink-low text-sm">No domains listed yet. Add one above.</div>
        )}
      </div>

      {/* Social Media Modal */}
      {socialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSocialModal(null)}>
          <div className="surface max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-semibold">Social Media Content</h2>
            <p className="font-mono text-xs text-ink-low">{socialModal.domain}</p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink-low">Headline (for visual)</label>
                <p className="mt-1 font-display text-lg font-semibold text-ink-hi whitespace-pre-line">{socialModal.headline}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink-low">Subtitle</label>
                <p className="mt-1 text-sm text-ink-mid">{socialModal.subtitle}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink-low">Caption (copy-paste)</label>
                <textarea
                  readOnly
                  value={socialModal.caption}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-line bg-bg-elev px-3 py-2 text-sm text-ink-hi"
                  onClick={(e) => { (e.target as HTMLTextAreaElement).select(); navigator.clipboard.writeText(socialModal.caption); }}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink-low">Hashtags</label>
                <p className="mt-1 text-xs text-brand">{socialModal.hashtags.join(" ")}</p>
              </div>
            </div>
            <p className="text-[10px] text-ink-low">Go to Admin → Social to create the visual with these values.</p>
            <button onClick={() => setSocialModal(null)} className="btn btn-ghost w-full justify-center text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
