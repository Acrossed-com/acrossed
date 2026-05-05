import Link from "next/link";
import { TypingCode } from "./TypingCode";

export function Hero() {
  return (
    <section className="relative pt-14 pb-16 sm:pt-20 sm:pb-24">
      <div className="mx-auto grid max-w-page items-start gap-12 px-5 sm:px-7 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2.25rem, 5vw, 3.875rem)",
              fontWeight: 600,
              lineHeight: 1.04,
              letterSpacing: "-0.028em",
              color: "#ECEDEE",
            }}
          >
            Decide before<br />
            <span
              style={{
                background:
                  "linear-gradient(180deg, #ECEDEE 0%, #8E8F94 130%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              you serve.
            </span>
          </h1>

          <p
            style={{
              fontFamily: "'Supreme', 'Switzer', sans-serif",
              fontSize: "1.125rem",
              lineHeight: 1.55,
              fontWeight: 400,
              color: "#A8A8AE",
              marginTop: 22,
              maxWidth: 540,
              letterSpacing: "-0.005em",
            }}
          >
            An open decision layer that judges every request — bots, scrapers,
            abusers, brute-forcers — in less than a millisecond, and lets the
            rest pass.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/sign-up"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: 500,
                color: "#07090d",
                background: "#ECEDEE",
                borderRadius: 7,
                transition: "background 120ms ease",
              }}
            >
              Get started
              <span style={{ opacity: 0.5, fontSize: 12 }}>→</span>
            </Link>
            <Link
              href="https://github.com/acrossed-com/acrossed"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                fontSize: 13.5,
                color: "#ECEDEE",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 7,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.07c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.94 10.94 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.73.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.14v3.18c0 .31.21.66.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
              </svg>
              Star on GitHub
            </Link>
          </div>

          <dl
            className="mt-10 grid grid-cols-3 gap-5 pt-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Stat k="< 1 ms" v="engine p50 latency" />
            <Stat k="25k req/s" v="per CPU core" />
            <Stat k="0 bytes" v="of your traffic stored" />
          </dl>
        </div>

        <div className="relative">
          <TypingCode />
        </div>
      </div>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <div
        className="font-display"
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "#ECEDEE",
          letterSpacing: "-0.02em",
        }}
      >
        {k}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 11.5,
          lineHeight: 1.4,
          color: "#71717A",
          fontFamily: "'Supreme', 'Switzer', sans-serif",
        }}
      >
        {v}
      </div>
    </div>
  );
}
