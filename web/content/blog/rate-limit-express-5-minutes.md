---
title: How to rate-limit your Express app in 5 minutes with Acrossed
description: Stop credential stuffing and brute-force attacks with a single middleware call. No Redis, no custom counters — just rules.
author: Acrossed Team
date: 2026-05-01
---

Credential stuffing costs real money. An attacker who can hammer your `/login` endpoint at full speed will eventually find a match. The traditional fix — Redis-backed counters in your middleware — works, but it's state you have to deploy, monitor, and scale.

Here's how to add per-IP rate limiting to an Express app using Acrossed in about five minutes.

## Step 1: Install the SDK

```bash
npm install acrossed
```

## Step 2: Get your credentials

Sign up at [acrossed.com](https://acrossed.com), create a project, and copy your `apiKey` and `signingSecret`. Store them in environment variables — never in source code.

```bash
export ACROSSED_KEY="ack_live_..."
export ACROSSED_SECRET="acsk_..."
```

## Step 3: Add the middleware

```ts
import { createClient } from "acrossed";
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
});
```

## Step 4: Define a rate-limit rule in your dashboard

Open your project's rules editor and add:

```json
[
  {
    "id": "login-throttle",
    "priority": 1,
    "match": { "path": "/login", "method": "POST" },
    "limit": { "requests": 10, "window": "1m", "by": "ip" }
  }
]
```

That rule says: allow a maximum of 10 POST requests to `/login` per IP per minute. The 11th attempt in that window gets a `deny` with reason `rate_limited`. Hit **Save & deploy** in the dashboard — the rule goes live immediately, no restarts.

## Step 5: Test it

```bash
for i in {1..12}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/login
done
# 200 200 200 ... 403 403
```

## Variations

**Rate-limit by header** (useful behind a proxy with `X-Real-IP`):
```json
{ "limit": { "requests": 10, "window": "1m", "by": "header", "header": "x-real-ip" } }
```

**Exempt your office IP** by putting an allow rule first (lower priority number = evaluated first):
```json
[
  { "id": "office-allow", "priority": 0, "ip_allow": ["203.0.113.10"], "action": "allow" },
  { "id": "login-throttle", "priority": 1, "match": { "path": "/login" }, "limit": { "requests": 10, "window": "1m", "by": "ip" } }
]
```
