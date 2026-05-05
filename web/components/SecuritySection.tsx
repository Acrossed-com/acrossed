import { RiLockLine as Lock, RiKey2Line as KeyRound, RiDatabase2Line as Database, RiShieldKeyholeLine as ShieldOff } from "@remixicon/react";
const FACTS = [
  {
    icon: Lock,
    title: "AES-256-GCM at rest",
    body: "Your rules and signing secrets are encrypted before they touch the database. The encryption key never leaves the engine process.",
  },
  {
    icon: KeyRound,
    title: "HMAC-SHA256 in flight",
    body: "Every response is signed with your project's secret. The SDK verifies before honouring — so a man-in-the-middle can't forge an ALLOW.",
  },
  {
    icon: Database,
    title: "Stateless on your traffic",
    body: "We never persist request bodies, headers, or response payloads. /check carries a small fingerprint that we evaluate and forget.",
  },
  {
    icon: ShieldOff,
    title: "Fail-open by default",
    body: "If our API is unreachable, the SDK returns ALLOW so an Acrossed outage cannot take your app down. Flip a flag to fail-closed if you want stricter behaviour.",
  },
];

export function SecuritySection() {
  return (
    <section
      id="security"
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
            Security model
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
            Cryptographically sound. Deliberately stateless.
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
            We're a security layer, so the security has to be the boring part.
            Here's exactly what we do — no buzzwords, no certifications we don't
            have.
          </p>
        </div>

        <div
          className="grid gap-px overflow-hidden md:grid-cols-2"
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 14,
          }}
        >
          {FACTS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              style={{
                background: "#07090d",
                padding: "30px 28px",
              }}
            >
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
              <h3
                className="font-display"
                style={{
                  marginTop: 18,
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
                  marginTop: 8,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: "#A1A1AA",
                  fontFamily: "'Supreme', 'Switzer', sans-serif",
                }}
              >
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
