---
title: Using Acrossed in Next.js middleware — a complete guide
description: Gate your Next.js App Router app at the middleware layer with Acrossed. Full examples including Clerk integration and route-specific rules.
author: Acrossed Team
date: 2026-05-02
---

Next.js middleware runs before every request reaches your app — before RSCs render, before API routes execute, before Clerk validates a session. That makes it the ideal place to drop an Acrossed gate.

## Setup

```bash
npm install acrossed
```

Add to `.env.local`:
```
ACROSSED_KEY=ack_live_...
ACROSSED_SECRET=acsk_...
```

## middleware.ts

```ts
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

## With Clerk

Chain Acrossed before Clerk so bad actors are stopped before Clerk even processes the JWT:

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
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
```

## Typical production ruleset

```json
[
  {
    "id": "sign-in-rate-limit",
    "priority": 10,
    "match": { "path": "/sign-in" },
    "limit": { "requests": 5, "window": "1m", "by": "ip" }
  },
  {
    "id": "admin-geo",
    "priority": 20,
    "match": { "path": "/admin" },
    "country_allow": ["US", "GB", "DE"],
    "reason": "admin_geo_restricted"
  },
  {
    "id": "block-headless",
    "priority": 5,
    "require_header": "user-agent",
    "reason": "missing_user_agent"
  }
]
```

Rules evaluate priority-order (lower number = first). First match wins. Define them in your dashboard and they go live instantly — no redeploy.

## Performance

An Acrossed check adds 5–25 ms network round-trip. The engine itself takes under 1 ms. Set `timeoutMs: 800` in middleware so a slow gate never stalls your request budget.
