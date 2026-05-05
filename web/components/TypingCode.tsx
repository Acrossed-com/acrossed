"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Animated, self-explaining install + code demo with JS / Python / Go tabs.
 *
 * Sequence per language:
 *   1. Type the install command into the terminal header
 *   2. Type the code body line by line
 *   3. Walk through each line and reveal an inline annotation in the side rail
 *   4. Hold for a beat, then loop within the same language
 *
 * Switching tabs resets the animation for that language.
 */

type Lang = "js" | "py" | "go";

type Line = {
  text: string;
  /** Short label shown in the rail when this line is active. */
  label: string;
  /** Longer plain-English explanation. */
  detail: string;
};

type LangSpec = {
  id: Lang;
  label: string;
  filename: string;
  install: string;
  successHint: string;
  lines: Line[];
};

const SPECS: LangSpec[] = [
  {
    id: "js",
    label: "Node / TS",
    filename: "server.ts",
    install: "npm install acrossed",
    successHint: "✓ added 1 package",
    lines: [
      {
        text: `import { Acrossed } from "acrossed";`,
        label: "Import",
        detail: "Pull in the SDK. Pure ESM, zero runtime dependencies, ~9 KB minified.",
      },
      { text: ``, label: "", detail: "" },
      {
        text: `const ac = new Acrossed({`,
        label: "Configure",
        detail: "Construct one client per process. Stateless and thread-safe.",
      },
      {
        text: `  apiKey:        process.env.ACROSSED_KEY,`,
        label: "Public key",
        detail: "Identifies your project. Safe at the edge — cannot sign on its own.",
      },
      {
        text: `  signingSecret: process.env.ACROSSED_SECRET,`,
        label: "HMAC secret",
        detail: "Signs every check with HMAC-SHA256. Server-only — never ship to the browser.",
      },
      {
        text: `});`,
        label: "Ready",
        detail: "That's the full setup. No pool, no warm-up, no background workers.",
      },
      { text: ``, label: "", detail: "" },
      {
        text: `// Express middleware — one call per request.`,
        label: "Drop-in",
        detail: "Works with Express, Fastify, Hono, Next.js, Remix — anything with a request.",
      },
      {
        text: `app.use(async (req, res, next) => {`,
        label: "Per-request",
        detail: "Runs before any of your routes. Async but completes in under a millisecond.",
      },
      {
        text: `  const d = await ac.check(req);`,
        label: "Decision",
        detail: "We hash IP, method, path and headers, sign them, return allow / deny + reason.",
      },
      {
        text: `  if (d.deny) return res.status(403).send(d.reason);`,
        label: "Block early",
        detail: "Denied requests never reach your handlers, your DB, or your downstream services.",
      },
      {
        text: `  next();`,
        label: "Pass through",
        detail: "Allowed requests continue exactly as before. Acrossed adds nothing to the response.",
      },
      {
        text: `});`,
        label: "Done",
        detail: "Six lines of integration. Restart your server and it's live.",
      },
    ],
  },
  {
    id: "py",
    label: "Python",
    filename: "app.py",
    install: "pip install acrossed",
    successHint: "✓ Successfully installed acrossed-1.0.0",
    lines: [
      {
        text: `from acrossed import Acrossed`,
        label: "Import",
        detail: "Pure stdlib client. No requests, no httpx, no extra deps. Works on any Python 3.10+.",
      },
      {
        text: `from flask import Flask, request, abort`,
        label: "Framework",
        detail: "Same pattern works with FastAPI, Django, Starlette — anything WSGI/ASGI.",
      },
      {
        text: `import os`,
        label: "Env",
        detail: "Keep secrets out of code. Twelve-factor by default.",
      },
      { text: ``, label: "", detail: "" },
      {
        text: `ac = Acrossed(`,
        label: "Configure",
        detail: "One module-level client. Thread-safe and connection-pooled.",
      },
      {
        text: `    api_key=os.environ["ACROSSED_KEY"],`,
        label: "Public key",
        detail: "Identifies your project. The engine looks up your rules from this.",
      },
      {
        text: `    signing_secret=os.environ["ACROSSED_SECRET"],`,
        label: "HMAC secret",
        detail: "Used to sign every check. Server-only — never ship to a notebook or client.",
      },
      {
        text: `)`,
        label: "Ready",
        detail: "Done. The next call will start enforcing rules.",
      },
      {
        text: `app = Flask(__name__)`,
        label: "App",
        detail: "Your normal Flask app. Acrossed is just a before-request hook.",
      },
      { text: ``, label: "", detail: "" },
      {
        text: `@app.before_request`,
        label: "Per-request",
        detail: "Hooks into Flask's pre-routing phase. Decisions happen before any route runs.",
      },
      {
        text: `def gate():`,
        label: "Gate",
        detail: "One function. No middleware classes, no decorators on every route.",
      },
      {
        text: `    d = ac.check_request(request)`,
        label: "Decision",
        detail: "Pulls IP, method, path and headers from Flask's request. Sub-millisecond.",
      },
      {
        text: `    if d.deny: abort(403, d.reason)`,
        label: "Block early",
        detail: "Aborts the request with a 403. Your view function never runs.",
      },
    ],
  },
  {
    id: "go",
    label: "Go",
    filename: "main.go",
    install: "go get github.com/acrossed-com/sdk-go",
    successHint: "✓ go: added github.com/acrossed-com/sdk-go v1.0.0",
    lines: [
      {
        text: `client, _ := acrossed.New(acrossed.Config{`,
        label: "Configure",
        detail: "One client per process. Safe across goroutines. No pool tuning needed.",
      },
      {
        text: `    APIKey:        os.Getenv("ACROSSED_KEY"),`,
        label: "Public key",
        detail: "Identifies your project to the engine. Bind via env, not source.",
      },
      {
        text: `    SigningSecret: os.Getenv("ACROSSED_SECRET"),`,
        label: "HMAC secret",
        detail: "Signs every check with HMAC-SHA256. Server-only — never embed in a binary you ship.",
      },
      {
        text: `})`,
        label: "Ready",
        detail: "Validated and ready. Returns an error if your keys are malformed.",
      },
      { text: ``, label: "", detail: "" },
      {
        text: `// Standard net/http — one wrapper, all routes covered.`,
        label: "Drop-in",
        detail: "Works with chi, gin, echo, gorilla — anything that exposes an http.Handler.",
      },
      {
        text: `http.Handle("/", acrossed.Gate(client, mux))`,
        label: "Gate",
        detail: "Wraps your mux. Every incoming request is checked before it reaches a handler.",
      },
      {
        text: `http.ListenAndServe(":8080", nil)`,
        label: "Serve",
        detail: "Standard. Acrossed adds nothing to your serve loop or shutdown logic.",
      },
      { text: ``, label: "", detail: "" },
      {
        text: `// Or call it manually, anywhere:`,
        label: "Manual",
        detail: "Need to gate a non-HTTP path (a queue worker, a gRPC call)? Call CheckHTTP yourself.",
      },
      {
        text: `// d, _ := client.CheckHTTP(ctx, r)`,
        label: "Decide",
        detail: "Pass any *http.Request. Get back allow / deny / reason in under a millisecond.",
      },
      {
        text: `// if d.Deny() { /* refuse */ }`,
        label: "Block early",
        detail: "Refuse work that hasn't been authorised. Save CPU, DB cycles, and downstream cost.",
      },
    ],
  },
];

const TYPE_SPEED_MS = 14;
const LINE_PAUSE_MS = 70;
const STEP_PAUSE_MS = 1700;
const HOLD_BEFORE_LOOP_MS = 4000;

type Phase = "install" | "code" | "walk" | "hold";

export function TypingCode() {
  const [lang, setLang] = useState<Lang>("js");
  const [phase, setPhase] = useState<Phase>("install");
  const [installTyped, setInstallTyped] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spec = SPECS.find((s) => s.id === lang)!;
  const LINES = spec.lines;

  function clear() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  // Reset whenever the language changes.
  useEffect(() => {
    clear();
    setPhase("install");
    setInstallTyped(0);
    setLineIdx(0);
    setCharIdx(0);
    setActiveStep(-1);
  }, [lang]);

  // Driver
  useEffect(() => {
    clear();

    if (phase === "install") {
      if (installTyped < spec.install.length) {
        timerRef.current = setTimeout(() => setInstallTyped((n) => n + 1), 38);
      } else {
        timerRef.current = setTimeout(() => setPhase("code"), 500);
      }
      return clear;
    }

    if (phase === "code") {
      const line = LINES[lineIdx];
      if (!line) {
        timerRef.current = setTimeout(() => {
          setActiveStep(0);
          setPhase("walk");
        }, 600);
        return clear;
      }
      if (charIdx < line.text.length) {
        timerRef.current = setTimeout(
          () => setCharIdx((n) => n + 1),
          line.text.length === 0 ? 0 : TYPE_SPEED_MS,
        );
      } else {
        timerRef.current = setTimeout(() => {
          setLineIdx((n) => n + 1);
          setCharIdx(0);
        }, LINE_PAUSE_MS);
      }
      return clear;
    }

    if (phase === "walk") {
      const stepLines = LINES.map((l, i) => ({ ...l, i })).filter((l) => l.label);
      if (activeStep < stepLines.length) {
        timerRef.current = setTimeout(() => setActiveStep((n) => n + 1), STEP_PAUSE_MS);
      } else {
        setPhase("hold");
      }
      return clear;
    }

    if (phase === "hold") {
      timerRef.current = setTimeout(() => {
        setInstallTyped(0);
        setLineIdx(0);
        setCharIdx(0);
        setActiveStep(-1);
        setPhase("install");
      }, HOLD_BEFORE_LOOP_MS);
      return clear;
    }
  }, [phase, installTyped, lineIdx, charIdx, activeStep, lang]);

  const stepLines = LINES.map((l, i) => ({ ...l, i })).filter((l) => l.label);
  const activeOriginalIdx =
    phase === "walk" && activeStep >= 0 && activeStep < stepLines.length
      ? stepLines[activeStep].i
      : -1;
  const currentDetail =
    phase === "walk" && activeStep >= 0 && activeStep < stepLines.length
      ? stepLines[activeStep]
      : null;

  return (
    <div
      style={{
        background: "#0a0c11",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow:
          "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 50px -20px rgba(0,0,0,0.5)",
      }}
    >
      {/* Window chrome + language tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px 0",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.015)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 6, paddingBottom: 8, paddingTop: 2 }}>
            <Dot color="#ff5f57" />
            <Dot color="#febc2e" />
            <Dot color="#28c840" />
          </div>
          <div style={{ display: "flex", marginLeft: 4 }}>
            {SPECS.map((s) => {
              const active = s.id === lang;
              return (
                <button
                  key={s.id}
                  onClick={() => setLang(s.id)}
                  style={{
                    padding: "9px 14px 8px",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: 11,
                    color: active ? "#ECEDEE" : "#71717A",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderBottom: active
                      ? "2px solid #6E8BFF"
                      : "2px solid transparent",
                    transition: "color 120ms ease, border-color 120ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!active)
                      (e.currentTarget as HTMLElement).style.color = "#A1A1AA";
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      (e.currentTarget as HTMLElement).style.color = "#71717A";
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 10.5,
            color: "#71717A",
            paddingBottom: 8,
            paddingTop: 2,
          }}
        >
          {spec.filename}
        </span>
      </div>

      {/* Install bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.012)",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 12,
        }}
      >
        <span style={{ color: "#4ADE80", marginRight: 10 }}>$</span>
        <span style={{ color: "#ECEDEE" }}>{spec.install.slice(0, installTyped)}</span>
        {phase === "install" && (
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 14,
              background: "#ECEDEE",
              marginLeft: 2,
              animation: "ac-blink 1s steps(2,start) infinite",
              verticalAlign: "middle",
            }}
          />
        )}
        {phase !== "install" && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10.5,
              color: "#4ADE80",
            }}
          >
            {spec.successHint}
          </span>
        )}
      </div>

      {/* Code body */}
      <div
        style={{
          padding: "16px 18px 18px",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 12.5,
          lineHeight: 1.65,
          minHeight: 320,
        }}
      >
        {LINES.map((line, i) => {
          const isTypedFully = i < lineIdx || phase === "walk" || phase === "hold";
          const isActiveTyping = phase === "code" && i === lineIdx;
          const visible = isTypedFully
            ? line.text
            : isActiveTyping
              ? line.text.slice(0, charIdx)
              : "";
          const isHighlighted = phase === "walk" && i === activeOriginalIdx;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 14,
                padding: "1px 6px",
                borderRadius: 4,
                background: isHighlighted ? "rgba(110,139,255,0.10)" : "transparent",
                borderLeft: isHighlighted
                  ? "2px solid #6E8BFF"
                  : "2px solid transparent",
                paddingLeft: 6,
                transition: "background 200ms ease, border-color 200ms ease",
                minHeight: 21,
              }}
            >
              <span
                style={{
                  color: isHighlighted ? "#6E8BFF" : "#3F3F46",
                  width: 18,
                  textAlign: "right",
                  flexShrink: 0,
                  fontSize: 10.5,
                  paddingTop: 2,
                  userSelect: "none",
                }}
              >
                {i + 1}
              </span>
              <span
                style={{ color: "#ECEDEE", whiteSpace: "pre", minHeight: 19 }}
                dangerouslySetInnerHTML={{ __html: highlight(visible, lang) }}
              />
              {isActiveTyping && (
                <span
                  style={{
                    display: "inline-block",
                    width: 7,
                    height: 14,
                    background: "#ECEDEE",
                    animation: "ac-blink 1s steps(2,start) infinite",
                    alignSelf: "center",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Annotation rail */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(110,139,255,0.025)",
          padding: "12px 16px",
          minHeight: 70,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {currentDetail ? (
          <>
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#6E8BFF",
                background: "rgba(110,139,255,0.12)",
                padding: "3px 8px",
                borderRadius: 3,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {currentDetail.label}
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                color: "#A1A1AA",
                lineHeight: 1.5,
              }}
            >
              {currentDetail.detail}
            </p>
          </>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: 11.5,
              color: "#52525B",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              letterSpacing: "0.04em",
            }}
          >
            // each line will explain itself in a moment
          </p>
        )}
      </div>

      {/* Status footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 14px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.012)",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 10.5,
          color: "#71717A",
        }}
      >
        <span>acrossed.com</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#4ADE80",
              boxShadow: "0 0 6px rgba(74,222,128,0.5)",
            }}
          />
          live · p50 0.6 ms
        </span>
      </div>

      <style>{`@keyframes ac-blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
        opacity: 0.85,
      }}
    />
  );
}

// Lightweight syntax highlighter — per language.
function highlight(src: string, lang: Lang): string {
  if (!src) return "";
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = esc(src);
  out = out.replace(
    /(&quot;|")(.*?)(&quot;|")/g,
    '<span style="color:#a5d6a7">$1$2$3</span>',
  );
  out = out.replace(/'([^']*)'/g, "<span style=\"color:#a5d6a7\">'$1'</span>");
  // Comments — // for js/go, # for python
  out = out.replace(
    /(\/\/[^\n]*)/g,
    '<span style="color:#5b6168;font-style:italic">$1</span>',
  );
  out = out.replace(
    /(#[^\n]*)/g,
    '<span style="color:#5b6168;font-style:italic">$1</span>',
  );
  const kwSets: Record<Lang, string[]> = {
    js: [
      "import",
      "from",
      "const",
      "let",
      "async",
      "await",
      "return",
      "if",
      "new",
      "process",
      "true",
      "false",
    ],
    py: [
      "from",
      "import",
      "def",
      "if",
      "return",
      "abort",
      "os",
      "True",
      "False",
      "None",
    ],
    go: [
      "package",
      "import",
      "func",
      "var",
      "return",
      "if",
      "_",
      "nil",
      "true",
      "false",
    ],
  };
  for (const k of kwSets[lang]) {
    out = out.replace(
      new RegExp(`\\b${k}\\b`, "g"),
      `<span style="color:#c792ea">${k}</span>`,
    );
  }
  out = out.replace(
    /\b([a-zA-Z_][a-zA-Z0-9_]*)\(/g,
    '<span style="color:#82aaff">$1</span>(',
  );
  return out;
}
