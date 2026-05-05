import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Docs — Acrossed",
  description: "Full integration examples for Node.js, Next.js middleware, Fastify plugins, edge functions, Python, and Go.",
};

function Code({ children }: { children: string }) {
  return (
    <pre className="glass mt-4 overflow-x-auto rounded-xl p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
      <code>{children.trim()}</code>
    </pre>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-14 scroll-mt-20 text-2xl font-semibold font-display">
      {children}
    </h2>
  );
}

function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return <h3 id={id} className="mt-8 text-lg font-semibold font-display">{children}</h3>;
}

const EXPRESS_EXAMPLE = `import { createClient } from "acrossed";
import express from "express";

const app = express();
const ac = createClient({
  apiKey:        process.env.ACROSSED_KEY!,
  signingSecret: process.env.ACROSSED_SECRET!,
});

app.use(async (req, res, next) => {
  const result = await ac.checkRequest({
    ip:      req.ip,
    method:  req.method,
    path:    req.path,
    headers: Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [k, String(v ?? "")])
    ),
  });
  if (result.decision === "deny") {
    return res.status(403).json({ error: result.reason });
  }
  next();
});`;

const NEXTJS_EXAMPLE = `// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "acrossed";

const ac = createClient({
  apiKey:        process.env.ACROSSED_KEY!,
  signingSecret: process.env.ACROSSED_SECRET!,
  timeoutMs:     800,
});

export async function middleware(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const result = await ac.checkRequest({
    ip,
    method:  req.method,
    path:    req.nextUrl.pathname,
    headers: Object.fromEntries(req.headers.entries()),
  });

  if (result.decision === "deny") {
    return new NextResponse(
      JSON.stringify({ error: result.reason }),
      { status: 403, headers: { "content-type": "application/json" } }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next\\/static|_next\\/image|favicon.ico).*)"],
};`;

const CLERK_EXAMPLE = `import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createClient } from "acrossed";
import { NextResponse } from "next/server";

const ac = createClient({
  apiKey: process.env.ACROSSED_KEY!,
  signingSecret: process.env.ACROSSED_SECRET!,
});

const isPublic = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const result = await ac.checkRequest({ ip, method: req.method, path: req.nextUrl.pathname });
  if (result.decision === "deny") return new NextResponse(null, { status: 403 });
  if (!isPublic(req)) await auth.protect();
});

export const config = {
  matcher: ["/((?!_next\\/static|_next\\/image|favicon.ico).*)"],
};`;

const FASTIFY_EXAMPLE = `import Fastify from "fastify";
import { createClient } from "acrossed";

const app = Fastify({ trustProxy: true });
const ac = createClient({
  apiKey:        process.env.ACROSSED_KEY!,
  signingSecret: process.env.ACROSSED_SECRET!,
});

// Global hook — runs before every route handler
app.addHook("onRequest", async (req, reply) => {
  const result = await ac.checkRequest({
    ip:      req.ip,
    method:  req.method,
    path:    req.url,
    headers: req.headers as Record<string, string>,
  });
  if (result.decision === "deny") {
    reply.code(403).send({ error: result.reason });
  }
});`;

const VERCEL_EDGE_EXAMPLE = `// middleware.ts (runtime: "edge")
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "acrossed";

export const runtime = "edge";

const ac = createClient({
  apiKey:        process.env.ACROSSED_KEY!,
  signingSecret: process.env.ACROSSED_SECRET!,
  timeoutMs:     600,
});

export async function middleware(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const result = await ac.checkRequest({ ip, method: req.method, path: req.nextUrl.pathname });
  if (result.decision === "deny") return new NextResponse(null, { status: 403 });
  return NextResponse.next();
}`;

const CF_WORKERS_EXAMPLE = `import { createClient } from "acrossed";

const ac = createClient({
  apiKey:        ACROSSED_KEY,
  signingSecret: ACROSSED_SECRET,
  timeoutMs:     600,
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
    const url = new URL(request.url);
    const result = await ac.checkRequest({
      ip,
      method: request.method,
      path:   url.pathname,
      headers: Object.fromEntries(request.headers.entries()),
    });
    if (result.decision === "deny") {
      return new Response(JSON.stringify({ error: result.reason }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }
    return fetch(request);
  },
};`;

const FLASK_EXAMPLE = `from acrossed import Acrossed
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
        abort(403, description=d.reason)`;

const DJANGO_EXAMPLE = `# myapp/middleware.py
from acrossed import Acrossed
from django.http import JsonResponse
import os

class AcrossedMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.ac = Acrossed(
            api_key=os.environ["ACROSSED_KEY"],
            signing_secret=os.environ["ACROSSED_SECRET"],
        )

    def __call__(self, request):
        ip = (request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
              or request.META.get("REMOTE_ADDR", ""))
        result = self.ac.check(ip=ip, method=request.method, path=request.path)
        if result.deny:
            return JsonResponse({"error": result.reason}, status=403)
        return self.get_response(request)

# settings.py — add to MIDDLEWARE list:
# "myapp.middleware.AcrossedMiddleware",`;

const GO_EXAMPLE = `package main

import (
    "net/http"
    "os"
    "github.com/acrossed-com/sdk-go"
)

func main() {
    client, err := acrossed.New(acrossed.Config{
        APIKey:        os.Getenv("ACROSSED_KEY"),
        SigningSecret: os.Getenv("ACROSSED_SECRET"),
    })
    if err != nil { panic(err) }

    mux := http.NewServeMux()
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("hello"))
    })

    http.ListenAndServe(":8080", gate(client, mux))
}

func gate(c *acrossed.Client, next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        result, err := c.Check(r.Context(), acrossed.CheckPayload{
            IP:     r.RemoteAddr,
            Method: r.Method,
            Path:   r.URL.Path,
        })
        if err != nil || result.Decision == "deny" {
            http.Error(w, "Forbidden", http.StatusForbidden)
            return
        }
        next.ServeHTTP(w, r)
    })
}`;

const RULE_SCHEMA_EXAMPLE = `[
  {
    "id":       "login-throttle",
    "priority": 10,
    "match":    { "path": "/login", "method": "POST" },

    "ip_block":       ["1.2.3.4", "10.0.0.0/8"],
    "ip_allow":       ["203.0.113.10"],
    "country_block":  ["RU", "KP"],
    "country_allow":  ["US", "DE"],
    "require_header": "x-auth-token",
    "forbid_header":  "x-bot-flag",

    "time": { "after": "09:00", "before": "21:00", "days": [1,2,3,4,5] },

    "limit": { "requests": 10, "window": "1m", "by": "ip" },

    "action": "deny",
    "reason": "too_many_requests"
  }
]`;

const WIRE_FORMAT_EXAMPLE = `// Required request headers:
X-Acrossed-Key:       <apiKey>
X-Acrossed-Timestamp: <unix seconds as string>
X-Acrossed-Signature: hex(HMAC-SHA256(signingSecret, timestamp + "." + rawBody))
Content-Type:         application/json

// Timestamps older than 10 seconds are rejected.

// Response shape:
{
  "decision":    "allow" | "deny",
  "reason":      "string",
  "matchedRule": "rule-id or undefined",
  "latencyUs":   480
}`;

const INSTALL_EXAMPLE = `npm install acrossed       # Node / TypeScript
pip install acrossed       # Python
go get github.com/acrossed-com/sdk-go  # Go`;

export default function Docs() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <p className="eyebrow mb-3">Documentation</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Acrossed API Reference</h1>
        <p className="mt-4 text-ink-mid">
          One endpoint, one decision, sub-millisecond. Every request is HMAC-SHA-256 signed.
          Rules live in memory. Your traffic data is never stored.
        </p>

        <nav className="mt-8 rounded-xl border border-line bg-bg-elev/50 p-5 text-sm">
          <p className="text-xs uppercase tracking-widest text-ink-low mb-3">On this page</p>
          <ul className="space-y-1.5 text-ink-mid columns-2">
            {[
              ["#install", "Install"],
              ["#quickstart", "Quickstart (Express)"],
              ["#nextjs", "Next.js middleware"],
              ["#nextjs-clerk", "With Clerk"],
              ["#fastify", "Fastify"],
              ["#edge", "Edge / Cloudflare Workers"],
              ["#python", "Python (Flask / Django)"],
              ["#go", "Go"],
              ["#rules", "Rule schema"],
              ["#wire", "Wire format"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="hover:text-ink-hi transition-colors">{label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <H2 id="install">1. Install</H2>
        <Code>{INSTALL_EXAMPLE}</Code>

        <H2 id="quickstart">2. Quickstart — Express</H2>
        <Code>{EXPRESS_EXAMPLE}</Code>

        <H2 id="nextjs">3. Next.js middleware</H2>
        <p className="mt-4 text-ink-mid">
          Drop a <code className="font-mono rounded bg-white/5 px-1.5 py-0.5">middleware.ts</code> at
          your project root. It runs before RSCs, API routes, and Clerk auth.
        </p>
        <Code>{NEXTJS_EXAMPLE}</Code>

        <H3 id="nextjs-clerk">With Clerk</H3>
        <Code>{CLERK_EXAMPLE}</Code>

        <H2 id="fastify">4. Fastify</H2>
        <Code>{FASTIFY_EXAMPLE}</Code>

        <H2 id="edge">5. Edge functions</H2>
        <H3>Vercel Edge Middleware</H3>
        <Code>{VERCEL_EDGE_EXAMPLE}</Code>
        <H3>Cloudflare Workers</H3>
        <Code>{CF_WORKERS_EXAMPLE}</Code>

        <H2 id="python">6. Python</H2>
        <H3>Flask</H3>
        <Code>{FLASK_EXAMPLE}</Code>
        <H3>Django middleware</H3>
        <Code>{DJANGO_EXAMPLE}</Code>

        <H2 id="go">7. Go</H2>
        <Code>{GO_EXAMPLE}</Code>

        <H2 id="rules">8. Rule schema</H2>
        <p className="mt-4 text-ink-mid">
          Rules are a JSON array evaluated priority-order (lowest number first). First match wins. Empty array = allow all.
        </p>
        <Code>{RULE_SCHEMA_EXAMPLE}</Code>

        <H2 id="wire">9. Wire format</H2>
        <p className="mt-4 text-ink-mid">
          If signing requests yourself (not using an SDK), the canonical signing string is{" "}
          <code className="font-mono rounded bg-white/5 px-1.5 py-0.5">timestamp.rawBody</code> and the
          signature is <code className="font-mono rounded bg-white/5 px-1.5 py-0.5">hex(HMAC-SHA-256(signingSecret, signingString))</code>.
        </p>
        <Code>{WIRE_FORMAT_EXAMPLE}</Code>
      </main>
      <Footer />
    </>
  );
}
