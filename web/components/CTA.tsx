import Link from "next/link";

export function CTA() {
  return (
    <section
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      className="py-28"
    >
      <div className="mx-auto max-w-page px-6">
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "radial-gradient(ellipse 800px 360px at 50% -10%, rgba(110,139,255,0.10), transparent 70%), #0a0c11",
            padding: "60px 32px",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#6E8BFF",
            }}
          >
            Free tier · 10,000 decisions / month
          </span>
          <h2
            className="font-display"
            style={{
              marginTop: 18,
              fontSize: "clamp(1.875rem, 4vw, 2.875rem)",
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: "-0.028em",
              color: "#ECEDEE",
              maxWidth: 720,
              marginInline: "auto",
            }}
          >
            Ship the gate in five minutes.
            <br />
            <span style={{ color: "#71717A" }}>
              No credit card. No agent. No infra to run.
            </span>
          </h2>
          <p
            style={{
              fontFamily: "'Supreme', 'Switzer', sans-serif",
              marginTop: 18,
              maxWidth: 560,
              marginInline: "auto",
              color: "#A1A1AA",
              fontSize: "1rem",
              lineHeight: 1.55,
            }}
          >
            Install the SDK, define a rule, deploy. If you outgrow the free
            tier, upgrade. If you don't, stay free forever.
          </p>
          <div
            style={{
              marginTop: 30,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <Link
              href="/sign-up"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "11px 20px",
                fontSize: 14,
                fontWeight: 500,
                color: "#07090d",
                background: "#ECEDEE",
                borderRadius: 7,
              }}
            >
              Create your project
              <span style={{ opacity: 0.5, fontSize: 12 }}>→</span>
            </Link>
            <Link
              href="/docs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "11px 18px",
                fontSize: 13.5,
                color: "#ECEDEE",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 7,
              }}
            >
              Read the docs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
