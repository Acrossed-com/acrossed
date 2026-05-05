"use client";
import { useState } from "react";

type Lang = "js" | "py" | "go";

const SAMPLES: Record<Lang, string> = {
  js: `import { Acrossed } from "acrossed";

const ac = new Acrossed({
  apiKey:        process.env.ACROSSED_KEY,
  signingSecret: process.env.ACROSSED_SECRET,
});

// Express middleware — one call per request.
app.use(async (req, res, next) => {
  const d = await ac.check(req);
  if (d.deny) return res.status(403).send(d.reason);
  next();
});`,
  py: `from acrossed import Acrossed
from flask import Flask, request, abort
import os

ac = Acrossed(
    api_key=os.environ["ACROSSED_KEY"],
    signing_secret=os.environ["ACROSSED_SECRET"],
)
app = Flask(__name__)

@app.before_request
def gate():
    d = ac.check_request(request)
    if d.deny:
        abort(403, d.reason)`,
  go: `client, _ := acrossed.New(acrossed.Config{
    APIKey:        os.Getenv("ACROSSED_KEY"),
    SigningSecret: os.Getenv("ACROSSED_SECRET"),
})

http.Handle("/", acrossed.Gate(client, mux))
http.ListenAndServe(":8080", nil)`,
};

const TABS: Array<{ id: Lang; label: string; install: string }> = [
  { id: "js", label: "Node / TS", install: "npm install acrossed" },
  { id: "py", label: "Python", install: "pip install acrossed" },
  { id: "go", label: "Go", install: "go get github.com/acrossed-com/sdk-go" },
];

export function CodeShowcase() {
  const [lang, setLang] = useState<Lang>("js");
  const tab = TABS.find((t) => t.id === lang)!;

  return (
    <div className="surface-strong w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-line px-2 py-2 sm:px-3">
        <div className="flex min-w-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setLang(t.id)}
              className={`shrink-0 px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs ${
                lang === t.id ? "text-ink-hi" : "text-ink-low hover:text-ink-mid"
              }`}
            >
              {t.label}
              {lang === t.id && (
                <span className="mt-1 block h-px w-full bg-brand" aria-hidden />
              )}
            </button>
          ))}
        </div>
        <span className="font-mono hidden truncate text-[10px] text-ink-low sm:inline">{tab.install}</span>
      </div>
      <pre className="code-block !rounded-none !border-0 px-3 py-3 text-[11.5px] sm:px-5 sm:py-4 sm:text-[12.5px]">
        <code dangerouslySetInnerHTML={{ __html: highlight(SAMPLES[lang], lang) }} />
      </pre>
      <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2 text-[11px] text-ink-low sm:px-4">
        <span className="font-mono truncate">acrossed.com</span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--good)]" />
          live · p50 0.6ms
        </span>
      </div>
    </div>
  );
}

// Tiny, deterministic syntax highlighter — no shiki, no JS bundle bloat.
function highlight(src: string, lang: Lang): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let out = esc(src);
  out = out.replace(/(&quot;|")(.*?)(&quot;|")/g, '<span class="tok-str">$1$2$3</span>');
  out = out.replace(/'([^']*)'/g, "<span class=\"tok-str\">'$1'</span>");
  out = out.replace(/`([^`]*)`/g, '<span class="tok-str">`$1`</span>');
  out = out.replace(/(\/\/[^\n]*)/g, '<span class="tok-com">$1</span>');
  out = out.replace(/(#[^\n]*)/g, '<span class="tok-com">$1</span>');
  const kws: Record<Lang, string[]> = {
    js: ["import", "from", "const", "let", "async", "await", "return", "if", "new", "process"],
    py: ["from", "import", "def", "if", "return", "abort", "os"],
    go: ["package", "import", "func", "var", "return", "if", "_"],
  };
  for (const k of kws[lang]) {
    out = out.replace(new RegExp(`\\b${k}\\b`, "g"), `<span class="tok-kw">${k}</span>`);
  }
  out = out.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\(/g, '<span class="tok-fn">$1</span>(');
  return out;
}
