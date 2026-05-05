# Acrossed Platform — Architecture & Reference Guide

> **For agents and developers:** This document describes what Acrossed is, how it is
> structured, and where things live on this server. Read it before making changes.

---

## What is Acrossed?

Acrossed is a **self-hosted, real-time API security and rule-enforcement engine**.
It sits in front of any web application and evaluates every incoming HTTP request
against a configurable set of rules (IP blocking, geo-fencing, rate-limiting,
header/query enforcement, time-windowed access). Decisions are returned in
sub-millisecond latency because the hot path is entirely in-memory — no database
queries on the request path.

### Core value proposition

| Feature                        | Detail                                                        |
|-------------------------------|---------------------------------------------------------------|
| Rule evaluation               | In-memory, < 1 ms, sorted by priority                        |
| Cryptographic integrity       | HMAC-SHA256 signed requests, AES-256-GCM encrypted rules     |
| Multi-runtime SDKs            | TypeScript/JS (npm), Python (PyPI), Go (module)              |
| Default subdomain             | Every project gets <slug>.acrsd.dev with on-demand TLS     |
| Custom domains                | Users attach their own domains; Caddy auto-provisions TLS    |
| Billing                       | Monthly check quotas enforced in-memory; Polar integration    |
| BYO Log Sink                  | Users can pipe decisions to their own Postgres                |
| Admin Dashboard               | Blog CMS, domain marketplace, inbox (Postfix maildir reader) |

---

## Directory Layout

`
/var/www/acrossed/
├── api/                 # Fastify API server (port 4000)
│   ├── src/
│   │   ├── config.ts         # Env schema (zod)
│   │   ├── index.ts          # Entry: registers all routes, hydrates store
│   │   ├── crypto/           # AES-256-GCM + HMAC-SHA256 helpers
│   │   ├── db/               # Drizzle ORM: schema, migrations, connection
│   │   ├── engine/           # Hot path: store (in-memory), evaluator, counter, usage buffer
│   │   ├── lib/              # Plans, keys, log sink, blog, slugs
│   │   ├── middleware/       # Clerk JWT verification
│   │   └── routes/           # check, projects, admin, billing, blog, domains, inbox, webhooks
│   ├── .env                  # Secrets (DB, Clerk, Polar, master key)
│   ├── package.json          # acrossed-api
│   └── drizzle.config.ts
├── web/                 # Next.js 15 dashboard + public site (port 3001)
│   ├── app/                  # App Router pages
│   │   ├── page.tsx               # Landing page
│   │   ├── dashboard/             # Authenticated dashboard
│   │   │   ├── admin/             # Admin-only: blog, domains, inbox, social
│   │   │   ├── billing/           # Subscription management
│   │   │   └── projects/[id]/     # Per-project rules, usage, domains
│   │   ├── blog/, docs/, pricing/ # Public pages
│   │   └── p/[slug]/, p/_host/    # Subdomain rendering pages
│   ├── middleware.ts         # Clerk auth + subdomain routing + Acrossed self-protection
│   ├── lib/                  # internalApi, api, admin, blog, cn
│   ├── components/           # React components
│   ├── .env.local            # Web secrets
│   └── package.json          # acrossed-web
├── sdk/                 # TypeScript/JS SDK (published to npm as 'acrossed')
│   ├── src/index.ts
│   ├── package.json          # version 0.2.0
│   └── tsconfig.json
├── sdk-python/          # Python SDK (published to PyPI as 'acrossed')
│   ├── acrossed/
│   │   ├── __init__.py
│   │   └── client.py
│   └── pyproject.toml        # version 1.0.0
├── sdk-go/              # Go SDK (module: github.com/.../sdk-go/acrossed)
│   ├── acrossed.go
│   ├── go.mod
│   └── examples/
├── docs/                # Documentation (this file lives here)
├── deploy.sh            # Deployment script
├── ecosystem.config.js  # PM2 process manifest
└── README.md
`

---

## Key Processes

| Process         | Manager | Port | What it does                                   |
|-----------------|---------|------|-----------------------------------------------|
| crossed-api  | PM2     | 4000 | Fastify API — rule checks, admin, billing     |
| crossed-web  | PM2     | 3001 | Next.js — dashboard, public pages, middleware |
| Caddy           | systemd | 443  | Reverse proxy, TLS, on-demand certs           |
| PostgreSQL      | systemd | 5432 | Data store for projects, usage, blog, domains |
| Postfix         | systemd | 25   | Inbound email → /var/mail/acrossed-inbox/     |

---

## Database

- **Host:** localhost:5432
- **Name:** crossed
- **User:** crossed
- **Tables:** projects, usage, custom_domains, log_posts, crossed_decisions
- **ORM:** Drizzle (schema at pi/src/db/schema.ts)

---

## Self-Protection (middleware.ts)

The web app uses its own Acrossed SDK to track visits. The middleware fires a
/check call to the local API on public page loads. This is **opt-in per-page**
and only triggers once per unique visitor session (cookie-gated) to avoid
inflating usage counts. Dashboard, auth, API, and static asset paths are excluded.

---

## Deployment

1. Pull changes / edit files on server
2. cd /var/www/acrossed/api && npm run build
3. cd /var/www/acrossed/web && npm run build
4. pm2 restart all

Or run ./deploy.sh which does the above.

---

## Package Publishing

- **npm (TypeScript SDK):** cd sdk && npm publish (token in ~/.npmrc)
- **PyPI (Python SDK):** cd sdk-python && python -m build && twine upload dist/*
- **Go SDK:** Push to GitHub; Go modules auto-resolve

---

## Known Gotchas

1. **Self-referential check loop:** The middleware must gate /check calls to
   avoid counting internal/bot traffic. Always use cookie-based dedup.
2. **Usage buffer flush:** Runs every 5 seconds; process restarts can lose up
   to 5 s of usage data.
3. **Rule store hydration:** On boot, all projects are decrypted into memory.
   Large deployments may need pagination.
4. **Caddy on-demand TLS:** The :443 catch-all routes ALL unknown domains
   through Caddy. Ensure /domains/check returns 404 for unknowns to prevent
   certificate issuance for random hosts.
