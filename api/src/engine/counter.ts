// Sliding-window counter, in-memory, per (projectId, bucket-key, window).
// Used for `limit: { requests, window }` rules. No DB calls on the hot path.
//
// Bucket keys can be derived from attacker-controlled values (e.g. header strings),
// so we hard-cap cardinality to MAX_BUCKETS. When that ceiling is hit we evict
// the OLDEST entries first (FIFO insertion order is preserved by Map).
const MAX_BUCKETS = 250_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

const WINDOWS: Record<string, number> = {
  "1s": 1_000,
  "10s": 10_000,
  "30s": 30_000,
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
  "1d": 24 * 60 * 60_000,
};

export function parseWindow(w: string): number {
  return WINDOWS[w] ?? 60_000;
}

export function hit(key: string, windowMs: number, max: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || cur.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      // Evict oldest 1% to make room — bounds memory under attack.
      const evict = Math.max(1, Math.floor(MAX_BUCKETS / 100));
      let i = 0;
      for (const k of buckets.keys()) {
        buckets.delete(k);
        if (++i >= evict) break;
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: 1 <= max, remaining: Math.max(0, max - 1) };
  }
  cur.count += 1;
  return { allowed: cur.count <= max, remaining: Math.max(0, max - cur.count) };
}

// Periodic GC so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}, 30_000).unref();
