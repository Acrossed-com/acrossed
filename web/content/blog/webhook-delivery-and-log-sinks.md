---
title: Decision logs and audit trails — how to get full visibility
description: By default Acrossed stores nothing about your traffic. Here's how to get a full decision log into your own Postgres database.
author: Acrossed Team
date: 2026-04-30
---

Acrossed is stateless by design — we don't keep a log of your decisions. But if you need one for compliance, debugging, or SIEM integration, you can plug in your own Postgres database and we'll write every decision there.

## Connecting your database

From your project dashboard, go to **Decision logs → Connect a Postgres database**.

Paste your connection string:
```
postgresql://user:password@db.neon.tech:5432/myapp
```

We validate the connection, auto-create the table, and start inserting one row per decision — asynchronously, off the hot path. The INSERT never blocks the `/check` response.

## The table schema

```sql
CREATE TABLE acrossed_decisions (
  id           BIGSERIAL PRIMARY KEY,
  project_id   TEXT NOT NULL,
  decision     TEXT NOT NULL,   -- 'allow' | 'deny'
  reason       TEXT NOT NULL,
  matched_rule TEXT,
  ip           TEXT,
  method       TEXT,
  path         TEXT,
  latency_us   INTEGER,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

You own the table. We never read it, never trim it. Add indexes, partition it, attach it to Metabase — it's yours.

## What about write failures?

If your database is unreachable, we drop the log row and surface the last error in your dashboard. Decisions still flow — we never block `/check` waiting on your DB.

## Security

The connection string is encrypted with AES-256-GCM before we store it. Even with full access to our database, an attacker sees ciphertext — not your Postgres credentials.

## Pausing and resuming

You can pause logging from the dashboard without removing the connection — useful during DB maintenance windows. Resume any time. Existing rows stay in your database.

## Combining with webhook events

Acrossed emits webhooks via Polar for billing events — plan upgrades, downgrades, quota resets. Verify them with the Standard Webhooks spec:

```ts
import { Webhook } from "standardwebhooks";

const wh = new Webhook(process.env.POLAR_WEBHOOK_SECRET!);
const event = wh.verify(rawBody, headers);

if (event.type === "subscription.updated") {
  const newPlan = event.data.product.metadata.plan_id;
  // sync to your local database
}
```

For most applications, the log sink gives you everything you need: every ALLOW and DENY with the matching rule ID, IP, method, path, engine latency in microseconds, and sub-second timestamps — all in infrastructure you own.
