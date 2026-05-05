import { lookupCountry } from "./geo.js";
import { hit, parseWindow } from "./counter.js";

// Rule schema (intentionally small + extensible).
export interface Rule {
  id?: string;
  priority?: number; // lower = evaluated first; default 100
  // Match conditions (all optional; omitted = wildcard)
  match?: {
    path?: string | string[]; // exact match (extensible to glob later)
    method?: string | string[];
  };
  // Block conditions
  ip_block?: string[];
  ip_allow?: string[]; // if present, only listed IPs may proceed (subject to other rules)
  country_block?: string[]; // ISO-2
  country_allow?: string[];
  require_header?: string | string[]; // header name(s) that MUST be present (non-empty)
  forbid_header?: string | string[];
  require_query?: string | string[];
  // Time window (UTC). e.g. { "after": "09:00", "before": "17:00", "days": [1,2,3,4,5] }
  time?: {
    after?: string; // "HH:MM"
    before?: string;
    days?: number[]; // 0=Sun..6=Sat
  };
  // Counter
  limit?: {
    requests: number;
    window: string; // e.g. "1m"
    by?: "ip" | "header"; // bucket key strategy
    header?: string; // when by=header
  };
  // Action: defaults to "deny" if any condition trips. "allow" can short-circuit.
  action?: "allow" | "deny";
  reason?: string;
}

export type Ruleset = Rule[];

export interface RequestCtx {
  projectId: string;
  ip: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
}

export interface Decision {
  decision: "allow" | "deny";
  reason: string;
  matchedRule?: string;
  latencyUs: number;
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function inTimeWindow(t: NonNullable<Rule["time"]>): boolean {
  const now = new Date();
  if (t.days && !t.days.includes(now.getUTCDay())) return false;
  const hhmm = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
  if (t.after && hhmm < t.after) return false;
  if (t.before && hhmm > t.before) return false;
  return true;
}

function matchesScope(rule: Rule, ctx: RequestCtx): boolean {
  const m = rule.match;
  if (!m) return true;
  if (m.path) {
    const paths = asArray(m.path);
    if (!paths.includes(ctx.path)) return false;
  }
  if (m.method) {
    const methods = asArray(m.method).map((s) => s.toUpperCase());
    if (!methods.includes(ctx.method.toUpperCase())) return false;
  }
  return true;
}

function evaluateOne(rule: Rule, ctx: RequestCtx): Decision | null {
  if (!matchesScope(rule, ctx)) return null;

  if (rule.ip_block?.includes(ctx.ip)) {
    return { decision: "deny", reason: rule.reason ?? "ip_blocked", matchedRule: rule.id, latencyUs: 0 };
  }
  if (rule.ip_allow && !rule.ip_allow.includes(ctx.ip)) {
    return { decision: "deny", reason: rule.reason ?? "ip_not_allowlisted", matchedRule: rule.id, latencyUs: 0 };
  }

  if (rule.country_block?.length || rule.country_allow?.length) {
    const country = lookupCountry(ctx.ip);
    if (rule.country_block?.length && country && rule.country_block.includes(country)) {
      return { decision: "deny", reason: rule.reason ?? `country_blocked:${country}`, matchedRule: rule.id, latencyUs: 0 };
    }
    if (rule.country_allow?.length && (!country || !rule.country_allow.includes(country))) {
      return { decision: "deny", reason: rule.reason ?? `country_not_allowed:${country ?? "unknown"}`, matchedRule: rule.id, latencyUs: 0 };
    }
  }

  for (const h of asArray(rule.require_header)) {
    if (!ctx.headers[h.toLowerCase()]) {
      return { decision: "deny", reason: rule.reason ?? `missing_header:${h}`, matchedRule: rule.id, latencyUs: 0 };
    }
  }
  for (const h of asArray(rule.forbid_header)) {
    if (ctx.headers[h.toLowerCase()]) {
      return { decision: "deny", reason: rule.reason ?? `forbidden_header:${h}`, matchedRule: rule.id, latencyUs: 0 };
    }
  }
  for (const q of asArray(rule.require_query)) {
    if (!ctx.query[q]) {
      return { decision: "deny", reason: rule.reason ?? `missing_query:${q}`, matchedRule: rule.id, latencyUs: 0 };
    }
  }

  if (rule.time && !inTimeWindow(rule.time)) {
    return { decision: "deny", reason: rule.reason ?? "outside_time_window", matchedRule: rule.id, latencyUs: 0 };
  }

  if (rule.limit) {
    const by = rule.limit.by ?? "ip";
    const bucketSeed = by === "header" && rule.limit.header
      ? ctx.headers[rule.limit.header.toLowerCase()] ?? ""
      : ctx.ip;
    const key = `${ctx.projectId}:${rule.id ?? ""}:${by}:${bucketSeed}`;
    const r = hit(key, parseWindow(rule.limit.window), rule.limit.requests);
    if (!r.allowed) {
      return { decision: "deny", reason: rule.reason ?? "rate_limited", matchedRule: rule.id, latencyUs: 0 };
    }
  }

  // Rule was in scope and no condition tripped -> explicit allow if action set, else continue.
  if (rule.action === "allow") {
    return { decision: "allow", reason: rule.reason ?? "allowed", matchedRule: rule.id, latencyUs: 0 };
  }
  return null;
}

export function evaluate(rules: Ruleset, ctx: RequestCtx): Decision {
  const start = process.hrtime.bigint();
  const sorted = [...rules].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  for (const rule of sorted) {
    const d = evaluateOne(rule, ctx);
    if (d) {
      const elapsed = Number(process.hrtime.bigint() - start) / 1000;
      return { ...d, latencyUs: Math.round(elapsed) };
    }
  }
  const elapsed = Number(process.hrtime.bigint() - start) / 1000;
  return { decision: "allow", reason: "no_rule_matched", latencyUs: Math.round(elapsed) };
}
