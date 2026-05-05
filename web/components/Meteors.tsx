"use client";
import { useMemo } from "react";

// Animated meteor streaks. A few of them deterministically "deny" (red fade),
// the rest stay glowing — visualizing requests passing through the engine.
export function Meteors({ count = 24 }: { count?: number }) {
  const meteors = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const blocked = i % 6 === 0;
      return {
        id: i,
        top: Math.random() * 60,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 4 + Math.random() * 5,
        blocked,
      };
    });
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {meteors.map((m) => (
        <span
          key={m.id}
          className="absolute h-0.5 w-0.5 rotate-[215deg] rounded-full"
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            animation: `meteor ${m.duration}s linear ${m.delay}s infinite`,
            background: m.blocked ? "#f43f5e" : "#a5b4fc",
            boxShadow: m.blocked
              ? "0 0 0 1px #f43f5e, 0 0 12px 2px rgba(244,63,94,0.6), -120px 120px 60px -10px rgba(244,63,94,0.4)"
              : "0 0 0 1px #c7d2fe, 0 0 12px 2px rgba(139,92,246,0.6), -180px 180px 80px -10px rgba(139,92,246,0.5)",
          }}
        />
      ))}
    </div>
  );
}
