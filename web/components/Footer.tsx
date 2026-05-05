import Link from "next/link";

const COLS: Array<[string, Array<[string, string, boolean?]>]> = [
  [
    "Product",
    [
      ["How it works", "/how-it-works"],
      ["Performance", "/performance"],
      ["Security", "/security"],
      ["Pricing", "/pricing"],
    ],
  ],
  [
    "Developers",
    [
      ["Docs", "/docs"],
      ["Changelog", "/changelog"],
      ["GitHub", "https://github.com/acrossed-com/acrossed", true],
      ["npm — acrossed", "https://www.npmjs.com/package/acrossed", true],
      ["PyPI — acrossed", "https://pypi.org/project/acrossed/", true],
      ["Go — sdk-go", "https://pkg.go.dev/github.com/acrossed-com/sdk-go", true],
    ],
  ],
  [
    "Company",
    [
      ["Blog", "/blog"],
      ["Medium", "https://medium.com/acrossed", true],
      ["Contact", "mailto:hello@acrossed.com"],
      ["Open source", "https://github.com/acrossed-com/acrossed", true],
    ],
  ],
];

export function Footer() {
  return (
    <footer
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      className="py-14 sm:py-16"
    >
      <div className="mx-auto grid max-w-page gap-10 px-4 sm:px-6 sm:grid-cols-2 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <svg
              width="22"
              height="24"
              viewBox="0 0 2664.92 3138.62"
              aria-hidden
              style={{ display: "block" }}
            >
              <path
                d="M1320.51,3617.28h334.33l726.5-855.68h826l-193.76,855.68h261.22L3985.43,478.66ZM3265,2506.82H2597.65l910-1071.79Z"
                transform="translate(-1320.51 -478.66)"
                fill="#ECEDEE"
              />
            </svg>
            <span
              className="font-display"
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: "#ECEDEE",
                letterSpacing: "-0.015em",
              }}
            >
              Acrossed
            </span>
          </div>
          <p
            style={{
              marginTop: 14,
              maxWidth: 280,
              fontSize: 13.5,
              color: "#A1A1AA",
              fontFamily: "'Supreme', 'Switzer', sans-serif",
              lineHeight: 1.55,
            }}
          >
            The open decision layer that judges every request in under a millisecond.
            Stateless. Cryptographic. Honest.
          </p>
        </div>
        {COLS.map(([title, links]) => (
          <div key={title}>
            <div
              style={{
                marginBottom: 14,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#71717A",
              }}
            >
              {title}
            </div>
            <ul style={{ display: "grid", gap: 8 }}>
              {links.map(([label, href, external]) => (
                <li key={href + label}>
                  <Link
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener" } : {})}
                    style={{
                      fontSize: 13.5,
                      color: "#C4C4CB",
                      fontFamily: "'Supreme', 'Switzer', sans-serif",
                      transition: "color 150ms ease",
                    }}
                    className="hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        className="mx-auto mt-12 flex max-w-page flex-wrap items-center justify-between gap-2 px-4 pt-6 sm:px-6"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          fontSize: 12,
          color: "#71717A",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span>© {new Date().getFullYear()} Acrossed</span>
        <span>v1.0 · stateless by design · MIT licensed engine</span>
      </div>
    </footer>
  );
}
