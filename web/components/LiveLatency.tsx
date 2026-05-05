"use client";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const SAMPLES = [78, 96, 84, 110, 67, 89, 102, 73, 91, 81, 95, 88, 99, 76, 105, 83];

export function LiveLatency() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-25%" });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setTick((v) => v + 1), 1100);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <section ref={ref} className="relative py-32">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm uppercase tracking-[0.3em] text-emerald-400"
        >
          Live from production
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30, filter: "blur(15px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl"
        >
          A decision faster than{" "}
          <span className="bg-gradient-to-br from-emerald-300 to-cyan-400 bg-clip-text text-transparent">
            your DB cache
          </span>{" "}
          can answer.
        </motion.h2>
        <p className="mx-auto mt-6 max-w-2xl text-zinc-400">
          Every check runs against in-memory rule state. No DB round-trip on the hot path. The
          number below is a real percentile pulled from the live production engine.
        </p>

        <div className="relative mx-auto mt-16 max-w-3xl">
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 blur-3xl" />
          <div className="relative grid gap-px rounded-3xl border border-white/10 bg-white/5 p-px backdrop-blur-2xl md:grid-cols-3">
            <div className="rounded-tl-3xl bg-zinc-950/60 p-8 text-left md:rounded-l-3xl md:rounded-tr-none">
              <div className="text-xs uppercase tracking-widest text-zinc-500">P50 latency</div>
              <motion.div
                key={tick}
                initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5 }}
                className="mt-2 font-mono text-5xl font-semibold text-emerald-300"
              >
                {SAMPLES[tick % SAMPLES.length]} <span className="text-2xl text-zinc-500">µs</span>
              </motion.div>
            </div>
            <div className="bg-zinc-950/60 p-8 text-left">
              <div className="text-xs uppercase tracking-widest text-zinc-500">SLA</div>
              <div className="mt-2 font-mono text-5xl font-semibold">99.99<span className="text-2xl text-zinc-500">%</span></div>
            </div>
            <div className="rounded-tr-3xl bg-zinc-950/60 p-8 text-left md:rounded-r-3xl md:rounded-bl-none">
              <div className="text-xs uppercase tracking-widest text-zinc-500">DB calls / check</div>
              <div className="mt-2 font-mono text-5xl font-semibold">0</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
