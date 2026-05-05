"use client";
import { useState } from "react";
import { RiAddLine as Plus, RiDeleteBin6Line as Trash2, RiArrowDownSLine as ChevronDown } from "@remixicon/react";
type RuleAction = "deny" | "allow";
type LimitBy = "ip" | "header";

interface RuleForm {
  id: string;
  priority: string;
  matchPath: string;
  matchMethod: string;
  ip_block: string;
  ip_allow: string;
  country_block: string;
  country_allow: string;
  require_header: string;
  limit_requests: string;
  limit_window: string;
  limit_by: LimitBy;
  limit_header: string;
  action: RuleAction;
  reason: string;
}

function emptyRule(): RuleForm {
  return {
    id: "", priority: "100", matchPath: "", matchMethod: "",
    ip_block: "", ip_allow: "", country_block: "", country_allow: "",
    require_header: "", limit_requests: "", limit_window: "1m",
    limit_by: "ip", limit_header: "", action: "deny", reason: "",
  };
}

function formToRule(f: RuleForm): Record<string, unknown> {
  const rule: Record<string, unknown> = {};
  if (f.id) rule.id = f.id;
  rule.priority = parseInt(f.priority) || 100;
  if (f.matchPath || f.matchMethod) {
    rule.match = {};
    if (f.matchPath) (rule.match as Record<string, string>).path = f.matchPath;
    if (f.matchMethod) (rule.match as Record<string, string>).method = f.matchMethod;
  }
  if (f.ip_block) rule.ip_block = f.ip_block.split(",").map((s) => s.trim()).filter(Boolean);
  if (f.ip_allow) rule.ip_allow = f.ip_allow.split(",").map((s) => s.trim()).filter(Boolean);
  if (f.country_block) rule.country_block = f.country_block.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (f.country_allow) rule.country_allow = f.country_allow.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (f.require_header) rule.require_header = f.require_header.trim();
  if (f.limit_requests) {
    rule.limit = {
      requests: parseInt(f.limit_requests) || 10,
      window: f.limit_window || "1m",
      by: f.limit_by,
      ...(f.limit_by === "header" && f.limit_header ? { header: f.limit_header } : {}),
    };
  }
  rule.action = f.action;
  if (f.reason) rule.reason = f.reason;
  return rule;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-mid mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-ink-low">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, className = "" }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-md border border-line bg-bg-base px-3 py-2 text-xs text-ink-hi placeholder:text-ink-low focus:border-brand-line focus:outline-none font-mono ${className}`}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-line bg-bg-base px-3 py-2 text-xs text-ink-hi focus:border-brand-line focus:outline-none pr-7"
      >
        {options.map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-low" />
    </div>
  );
}

export function RulesBuilder({ projectId, initial }: { projectId: string; initial: unknown[] }) {
  const [mode, setMode] = useState<"visual" | "json">("visual");
  const [forms, setForms] = useState<RuleForm[]>(() => {
    if (initial.length === 0) return [emptyRule()];
    // Try to parse existing rules back to form state (best effort)
    return initial.map((r) => {
      const rule = r as Record<string, unknown>;
      const match = (rule.match as Record<string, string> | undefined) ?? {};
      const limit = (rule.limit as Record<string, unknown> | undefined) ?? {};
      return {
        id: String(rule.id ?? ""),
        priority: String(rule.priority ?? 100),
        matchPath: String(match.path ?? ""),
        matchMethod: String(match.method ?? ""),
        ip_block: (rule.ip_block as string[] | undefined)?.join(", ") ?? "",
        ip_allow: (rule.ip_allow as string[] | undefined)?.join(", ") ?? "",
        country_block: (rule.country_block as string[] | undefined)?.join(", ") ?? "",
        country_allow: (rule.country_allow as string[] | undefined)?.join(", ") ?? "",
        require_header: String(rule.require_header ?? ""),
        limit_requests: limit.requests ? String(limit.requests) : "",
        limit_window: String(limit.window ?? "1m"),
        limit_by: (limit.by as LimitBy) ?? "ip",
        limit_header: String(limit.header ?? ""),
        action: (rule.action as RuleAction) ?? "deny",
        reason: String(rule.reason ?? ""),
      };
    });
  });
  const [jsonText, setJsonText] = useState(() => JSON.stringify(initial, null, 2));
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  function getRules(): unknown[] {
    if (mode === "json") {
      try { return JSON.parse(jsonText); } catch { return []; }
    }
    return forms.map(formToRule);
  }

  function update(idx: number, field: keyof RuleForm, val: string) {
    setForms((prev) => prev.map((f, i) => i === idx ? { ...f, [field]: val } : f));
  }

  async function save() {
    const rules = getRules();
    if (!Array.isArray(rules)) { setStatus("✗ rules must be an array"); return; }
    setPending(true);
    setStatus("");
    try {
      const res = await fetch(`/api/projects/${projectId}/rules`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStatus(`✓ saved ${data.count} rules`);
      // Sync json text when saving from visual
      if (mode === "visual") setJsonText(JSON.stringify(rules, null, 2));
    } catch (e) {
      setStatus(`✗ ${(e as Error).message}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="surface rounded-xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-medium text-ink-hi sm:text-lg">Rules</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-line overflow-hidden text-xs">
            <button
              onClick={() => {
                if (mode === "json") {
                  try {
                    const parsed = JSON.parse(jsonText);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      setForms(parsed.map((r) => {
                        const rule = r as Record<string, unknown>;
                        const match = (rule.match as Record<string, string> | undefined) ?? {};
                        const limit = (rule.limit as Record<string, unknown> | undefined) ?? {};
                        return {
                          id: String(rule.id ?? ""), priority: String(rule.priority ?? 100),
                          matchPath: String(match.path ?? ""), matchMethod: String(match.method ?? ""),
                          ip_block: (rule.ip_block as string[] | undefined)?.join(", ") ?? "",
                          ip_allow: (rule.ip_allow as string[] | undefined)?.join(", ") ?? "",
                          country_block: (rule.country_block as string[] | undefined)?.join(", ") ?? "",
                          country_allow: (rule.country_allow as string[] | undefined)?.join(", ") ?? "",
                          require_header: String(rule.require_header ?? ""),
                          limit_requests: limit.requests ? String(limit.requests) : "",
                          limit_window: String(limit.window ?? "1m"),
                          limit_by: (limit.by as LimitBy) ?? "ip",
                          limit_header: String(limit.header ?? ""),
                          action: (rule.action as RuleAction) ?? "deny",
                          reason: String(rule.reason ?? ""),
                        };
                      }));
                    }
                  } catch { /* keep existing forms */ }
                }
                setMode("visual");
              }}
              className={`px-3 py-1.5 transition-colors ${mode === "visual" ? "bg-bg-elev text-ink-hi" : "text-ink-low hover:text-ink-mid"}`}
            >
              Visual
            </button>
            <button
              onClick={() => {
                setJsonText(JSON.stringify(forms.map(formToRule), null, 2));
                setMode("json");
              }}
              className={`px-3 py-1.5 transition-colors ${mode === "json" ? "bg-bg-elev text-ink-hi" : "text-ink-low hover:text-ink-mid"}`}
            >
              JSON
            </button>
          </div>
          <span className="font-mono text-xs text-ink-low">{status}</span>
          <button
            onClick={save}
            disabled={pending}
            className="btn btn-primary text-xs"
          >
            {pending ? "Saving…" : "Save & deploy"}
          </button>
        </div>
      </div>

      {mode === "visual" ? (
        <div className="space-y-4">
          {forms.map((form, idx) => (
            <div key={idx} className="rounded-lg border border-line bg-bg-elev/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-low">
                  Rule {idx + 1}
                </span>
                {forms.length > 1 && (
                  <button
                    onClick={() => setForms((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-ink-low hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Rule ID" hint="Optional — shown in deny reason">
                  <Input value={form.id} onChange={(v) => update(idx, "id", v)} placeholder="login-throttle" />
                </Field>
                <Field label="Priority" hint="Lower number = evaluated first">
                  <Input value={form.priority} onChange={(v) => update(idx, "priority", v)} placeholder="100" />
                </Field>
                <Field label="Action">
                  <Select value={form.action} onChange={(v) => update(idx, "action", v as RuleAction)} options={[["deny", "Deny (block)"], ["allow", "Allow (short-circuit)"]]} />
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Match path" hint="Leave blank to match all paths">
                  <Input value={form.matchPath} onChange={(v) => update(idx, "matchPath", v)} placeholder="/login" />
                </Field>
                <Field label="Match method" hint="GET, POST, etc. Leave blank for all">
                  <Input value={form.matchMethod} onChange={(v) => update(idx, "matchMethod", v)} placeholder="POST" />
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Block IPs" hint="Comma-separated IPs or CIDR ranges">
                  <Input value={form.ip_block} onChange={(v) => update(idx, "ip_block", v)} placeholder="1.2.3.4, 10.0.0.0/8" />
                </Field>
                <Field label="Allow-list IPs" hint="All others denied if this is set">
                  <Input value={form.ip_allow} onChange={(v) => update(idx, "ip_allow", v)} placeholder="203.0.113.10" />
                </Field>
                <Field label="Block countries" hint="ISO-2 codes, comma-separated (Pro+)">
                  <Input value={form.country_block} onChange={(v) => update(idx, "country_block", v)} placeholder="RU, KP" />
                </Field>
                <Field label="Allow countries" hint="All others denied if set (Pro+)">
                  <Input value={form.country_allow} onChange={(v) => update(idx, "country_allow", v)} placeholder="US, DE, GB" />
                </Field>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Require header" hint="Request must include this header">
                  <Input value={form.require_header} onChange={(v) => update(idx, "require_header", v)} placeholder="x-api-key" />
                </Field>
                <Field label="Deny reason" hint="Shown in the decision response">
                  <Input value={form.reason} onChange={(v) => update(idx, "reason", v)} placeholder="rate_limited" />
                </Field>
              </div>

              <div className="mt-3 rounded-md border border-line bg-bg-base/50 p-3">
                <p className="text-[10px] uppercase tracking-widest text-ink-low mb-2">Rate limit</p>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Max requests">
                    <Input value={form.limit_requests} onChange={(v) => update(idx, "limit_requests", v)} placeholder="10" />
                  </Field>
                  <Field label="Window">
                    <Select value={form.limit_window} onChange={(v) => update(idx, "limit_window", v)} options={[["30s", "30 seconds"], ["1m", "1 minute"], ["5m", "5 minutes"], ["1h", "1 hour"]]} />
                  </Field>
                  <Field label="Key by">
                    <Select value={form.limit_by} onChange={(v) => update(idx, "limit_by", v as LimitBy)} options={[["ip", "IP address"], ["header", "Header value"]]} />
                  </Field>
                  {form.limit_by === "header" && (
                    <Field label="Header name">
                      <Input value={form.limit_header} onChange={(v) => update(idx, "limit_header", v)} placeholder="x-api-key" />
                    </Field>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => setForms((prev) => [...prev, emptyRule()])}
            className="flex items-center gap-2 rounded-lg border border-dashed border-line px-4 py-3 text-xs text-ink-low hover:border-brand-line hover:text-ink-mid transition-colors w-full justify-center"
          >
            <Plus className="h-3.5 w-3.5" /> Add rule
          </button>
        </div>
      ) : (
        <div>
          <textarea
            spellCheck={false}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="font-mono h-[28rem] w-full resize-none rounded-lg border border-line bg-black/30 p-4 text-sm text-ink-hi outline-none focus:border-brand-line"
          />
          <p className="mt-2 text-xs text-ink-low">
            Rules are AES-256 encrypted at rest and pushed into the in-memory engine immediately on save.
          </p>
        </div>
      )}
    </section>
  );
}
