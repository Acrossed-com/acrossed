---
title: Fail-open vs fail-closed — the tradeoff every API team faces
description: When your security layer can't reach its backend, what should it do? There is no universally right answer — but there is a right question to ask.
author: Acrossed Team
date: 2026-04-18
---

Every SDK we ship defaults to **fail-open**. That means: if `api.acrossed.com` is unreachable, the check returns `allow` and your app keeps serving traffic normally.

We made that the default deliberately.

## The case for fail-open

Your app has an SLA. Acrossed is a dependency. If Acrossed goes down and you're fail-closed, your app goes down too — not because of a bug in your code, but because of a bug in ours.

A login endpoint that lets every IP through for 30 minutes during an incident is better than one that returns 503 to every user for 30 minutes. The security risk during a fail-open window is real but bounded: attackers rarely know your security vendor is down, the window is typically minutes, and you still have your application-level auth.

## The case for fail-closed

Some applications have the opposite calculus. If you're running a financial API, a healthcare record system, or any service where unauthorized access during a brief window creates serious regulatory exposure — fail-closed is the right call. 30 minutes of downtime beats 30 minutes of unfiltered access.

## How to configure it

```ts
// Fail-open (default — you don't need to set this):
const ac = createClient({
  apiKey:        process.env.ACROSSED_KEY!,
  signingSecret: process.env.ACROSSED_SECRET!,
});

// Fail-closed:
const ac = createClient({
  apiKey:        process.env.ACROSSED_KEY!,
  signingSecret: process.env.ACROSSED_SECRET!,
  failClosed: true,
});
```

Python: `Acrossed(api_key=..., signing_secret=..., fail_closed=True)`

Go: `acrossed.New(acrossed.Config{ ..., FailClosed: true })`

## A middle path: timeout tuning

```ts
const ac = createClient({
  apiKey:        process.env.ACROSSED_KEY!,
  signingSecret: process.env.ACROSSED_SECRET!,
  timeoutMs:     500, // fail within 500 ms — fast fail, still fail-open
});
```

The check itself takes under 5 ms. 500 ms gives 100x headroom for network jitter before abandoning the check and letting the request through.

## What we'd recommend

Build your default config fail-open with a 500 ms timeout. For endpoints that genuinely can't afford unfiltered access — `/admin`, billing, account deletion — use a separate client with `failClosed: true` applied only to those routes.

That way an Acrossed outage takes down your admin panel (which nobody was hammering anyway) without affecting your public API.
