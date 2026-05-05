"use client";
import { motion } from "framer-motion";

const STACKS = [
  { name: "Node.js", color: "#6da55f" },
  { name: "Python", color: "#3776ab" },
  { name: "Go", color: "#00add8" },
  { name: "Next.js", color: "#ffffff" },
  { name: "Fastify", color: "#00b4b6" },
  { name: "Django", color: "#0c4b33" },
  { name: "Rails", color: "#cc0000" },
  { name: "Laravel", color: "#ff2d20" },
  { name: "Express", color: "#aaaaaa" },
  { name: "Hono", color: "#e36002" },
  { name: "Remix", color: "#ffffff" },
  { name: "Flask", color: "#999999" },
];

export function LogoCloud() {
  return (
    <section className="relative -mt-8 border-y border-white/5 bg-zinc-950/60 py-10 backdrop-blur overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-zinc-500 mb-8">
          One SDK call. Drop into any stack.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
          {STACKS.map((it, i) => (
            <motion.div
              key={it.name}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="flex items-center gap-2 group"
            >
              <span
                className="inline-block h-2 w-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: it.color }}
              />
              <span className="font-mono text-sm text-zinc-500 transition-colors group-hover:text-zinc-200">
                {it.name}
              </span>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-[11px] text-zinc-600 mt-8 font-mono">
          JS · Python · Go SDKs available · MIT licensed · zero dependencies on the hot path
        </p>
      </div>
    </section>
  );
}
