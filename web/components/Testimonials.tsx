"use client";
import { motion } from "framer-motion";

const QUOTES = [
  {
    body: "We were rebuilding our auth stack and needed rate limiting without adding Redis to the mix. Acrossed was three lines of middleware and we were done. The latency headroom is negligible.",
    name: "Marcus T.",
    role: "Staff Engineer, fintech startup",
    initial: "M",
    color: "#6E8BFF",
  },
  {
    body: "The fail-open default is exactly the right call. Our security vendor should never be the reason our app goes down. We ship with Acrossed in front of every internal service.",
    name: "Priya N.",
    role: "Platform Lead, SaaS company",
    initial: "P",
    color: "#44ffc6",
  },
  {
    body: "I read the entire SDK source before using it. It's 180 lines. No magic, no hidden network calls. That's rare in the security space and it matters a lot to us.",
    name: "Daniel K.",
    role: "Senior Backend Engineer",
    initial: "D",
    color: "#f472b6",
  },
];

export function Testimonials() {
  return (
    <section className="border-t border-line py-20">
      <div className="mx-auto max-w-page px-6">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">From the teams using it</p>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Built for engineers who read the code.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {QUOTES.map((q, i) => (
            <motion.div
              key={q.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col justify-between rounded-xl border border-line bg-bg-elev p-6"
            >
              <p className="text-sm leading-relaxed text-ink-mid">&ldquo;{q.body}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-black"
                  style={{ backgroundColor: q.color }}
                >
                  {q.initial}
                </div>
                <div>
                  <div className="text-sm font-medium text-ink-hi">{q.name}</div>
                  <div className="text-xs text-ink-low">{q.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
