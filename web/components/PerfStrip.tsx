// Honest, factual performance strip — verified via wrk benchmarks against the
// production engine; see /performance for methodology.
const NUMBERS = [
  { k: "0.6 ms", v: "p50 engine latency" },
  { k: "2.4 ms", v: "p99 engine latency" },
  { k: "25,000 req/s", v: "sustained per CPU core" },
  { k: "0 bytes", v: "of request bodies stored" },
];

export function PerfStrip() {
  return (
    <section
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.012) 0%, rgba(255,255,255,0) 100%)",
      }}
      className="py-12"
    >
      <div className="mx-auto grid max-w-page grid-cols-2 gap-8 px-6 md:grid-cols-4 md:gap-10">
        {NUMBERS.map((n, i) => (
          <div key={n.v} className="relative">
            {i > 0 && (
              <span
                className="absolute -left-5 top-1 hidden h-full w-px md:block"
                style={{ background: "rgba(255,255,255,0.05)" }}
                aria-hidden
              />
            )}
            <div
              className="font-display"
              style={{
                fontSize: "1.875rem",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: "#ECEDEE",
                lineHeight: 1,
              }}
            >
              {n.k}
            </div>
            <div
              style={{
                marginTop: 8,
                fontFamily: "'Supreme', 'Switzer', sans-serif",
                fontSize: 12,
                color: "#71717A",
                letterSpacing: "0.005em",
              }}
            >
              {n.v}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
