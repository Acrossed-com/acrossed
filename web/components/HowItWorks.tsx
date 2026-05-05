import { RiShieldCheckLine as ShieldCheck, RiPlugLine as Plug, RiFlashlightLine as Zap } from "@remixicon/react";
const STEPS = [
  {
    icon: Plug,
    n: "01",
    title: "Install the SDK",
    body: "One package per language — Node, Python, or Go. Get an API key and an HMAC signing secret in under a minute.",
  },
  {
    icon: ShieldCheck,
    n: "02",
    title: "Define your rules",
    body: "Block IP ranges, geos, paths, headers. Add per-IP rate limits. Combine in any order — first match wins.",
  },
  {
    icon: Zap,
    n: "03",
    title: "Get sub-ms decisions",
    body: "Every request to your app calls /check. We return ALLOW or DENY, signed. You enforce — we just decide.",
  },
];

export function HowItWorks() {
  return (
    <section
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      className="py-24"
    >
      <div className="mx-auto max-w-page px-6">
        <div className="mb-14 max-w-2xl">
          <p
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#6E8BFF",
              marginBottom: 14,
            }}
          >
            How it works
          </p>
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(1.875rem, 3.5vw, 2.625rem)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              color: "#ECEDEE",
            }}
          >
            Three steps. No infrastructure to run.
          </h2>
          <p
            style={{
              fontFamily: "'Supreme', 'Switzer', sans-serif",
              fontSize: "1.0625rem",
              lineHeight: 1.55,
              color: "#A1A1AA",
              marginTop: 18,
              maxWidth: 600,
            }}
          >
            Acrossed is a hosted decision engine. You send us a request
            fingerprint, we answer in under a millisecond. There's nothing to
            deploy and nothing to scale on your end.
          </p>
        </div>

        <ol
          className="grid gap-px overflow-hidden md:grid-cols-3"
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 14,
          }}
        >
          {STEPS.map(({ icon: Icon, n, title, body }) => (
            <li
              key={n}
              style={{
                background: "#07090d",
                padding: "30px 28px",
                position: "relative",
                transition: "background 200ms ease",
              }}
              className="group"
            >
              <div className="flex items-center justify-between">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    background: "rgba(110,139,255,0.08)",
                    border: "1px solid rgba(110,139,255,0.15)",
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: "#6E8BFF" }} strokeWidth={1.6} />
                </div>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: 11,
                    color: "#52525B",
                    letterSpacing: "0.06em",
                  }}
                >
                  {n}
                </span>
              </div>
              <h3
                className="font-display"
                style={{
                  marginTop: 22,
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#ECEDEE",
                  letterSpacing: "-0.015em",
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  marginTop: 10,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: "#A1A1AA",
                  fontFamily: "'Supreme', 'Switzer', sans-serif",
                }}
              >
                {body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
