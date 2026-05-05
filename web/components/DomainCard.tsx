"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RiGlobalLine as Globe, RiDeleteBin6Line as Trash2, RiAddLine as Plus, RiFileCopyLine as Copy, RiCheckLine as Check } from "@remixicon/react";
interface CustomDomain {
  domain: string;
  verifiedAt: string | null;
}

export function DomainCard({
  projectId,
  plan,
  maxDomains,
  domains,
}: {
  projectId: string;
  plan: string;
  maxDomains: number;
  domains: CustomDomain[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<{ name: string; value: string } | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/dashboard/api/projects/${projectId}/domains`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain: domain.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? `error ${res.status}`);
      return;
    }
    setInstructions({ name: domain.trim(), value: "edge.acrsd.dev" });
    setDomain("");
    startTransition(() => router.refresh());
  }

  async function remove(d: string) {
    await fetch(`/dashboard/api/projects/${projectId}/domains/${encodeURIComponent(d)}`, {
      method: "DELETE",
    });
    startTransition(() => router.refresh());
  }

  function copy(v: string) {
    navigator.clipboard.writeText(v);
    setCopied(v);
    setTimeout(() => setCopied(null), 1500);
  }

  const limited = maxDomains < 1;
  const atCap = !limited && domains.length >= maxDomains;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-medium text-zinc-200">Custom domains</h3>
          <span className="text-xs text-zinc-500">
            ({domains.length}/{maxDomains === 0 ? "—" : maxDomains})
          </span>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs uppercase tracking-widest text-zinc-400 capitalize">
          {plan}
        </span>
      </div>

      {limited ? (
        <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">
          Custom domains aren&apos;t available on Free.{" "}
          <a href="/dashboard/billing" className="font-medium underline">
            Upgrade to Pro
          </a>{" "}
          to attach up to 3.
        </p>
      ) : (
        <>
          <form onSubmit={add} className="mt-4 flex gap-2">
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="api.your-company.com"
              disabled={atCap}
              className="flex-1 rounded-lg border border-white/10 bg-zinc-950/40 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-400/50 focus:outline-none disabled:opacity-50"
            />
            <button
              disabled={!domain || atCap || pending}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </form>
          {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
          {instructions && (
            <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-100">
              <p className="font-medium">Almost there — add this CNAME at your DNS provider:</p>
              <div className="mt-3 grid grid-cols-[60px_1fr_auto] items-center gap-2 font-mono text-xs">
                <span className="text-zinc-500">TYPE</span>
                <span>CNAME</span>
                <span />
                <span className="text-zinc-500">NAME</span>
                <span>{instructions.name}</span>
                <button onClick={() => copy(instructions.name)} className="text-zinc-400 hover:text-white">
                  {copied === instructions.name ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <span className="text-zinc-500">VALUE</span>
                <span>{instructions.value}</span>
                <button onClick={() => copy(instructions.value)} className="text-zinc-400 hover:text-white">
                  {copied === instructions.value ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="mt-3 text-xs text-emerald-300/80">
                The first HTTPS request will trigger automatic Let&apos;s Encrypt issuance — usually under 5 seconds.
              </p>
            </div>
          )}
        </>
      )}

      {domains.length > 0 && (
        <ul className="mt-4 divide-y divide-white/5 rounded-lg border border-white/10">
          {domains.map((d) => (
            <li key={d.domain} className="flex items-center justify-between p-4">
              <div>
                <p className="font-mono text-sm text-zinc-100">{d.domain}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {d.verifiedAt ? "Verified · Live" : "Pending DNS verification"}
                </p>
              </div>
              <button
                onClick={() => remove(d.domain)}
                className="text-zinc-500 hover:text-rose-400"
                aria-label="remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
