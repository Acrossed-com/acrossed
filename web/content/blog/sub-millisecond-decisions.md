---
title: How we serve sub-millisecond decisions on a single VPS
description: A walk through the engineering choices that let one Node process answer 25,000 ALLOW/DENY questions per second without breaking a sweat.
author: Acrossed Team
date: 2026-04-29
---

The question we get most often: *"Single VPS? Really?"*

Yes, really. Here's how.

## The hot path is in-memory

Every project's ruleset and signing secret is loaded into a `Map` at boot. The `/check` route looks like this, in spirit:

```ts
app.post("/check", async (req) => {
  const entry = byKeyHash.get(req.headers["x-acrossed-key-hash"]);
  if (!entry) return reply.code(401).send();
  if (!verifyHmac(req.rawBody, req.headers["x-signature"], entry.signingSecret))
    return reply.code(401).send();
  if (!tryConsumeQuota(entry)) return reply.code(402).send();
  const decision = evaluate(entry.rules, req.body);
  return signedResponse(decision, entry.signingSecret);
});
```

Notice what's *not* there: a database call. A cache lookup. A network hop. The hot path touches Postgres exactly zero times. It's pure function evaluation against in-process state.

## We picked Fastify on purpose

Express is the friendly default in Node-land, but it costs you something north of 30 microseconds per request just in middleware traversal. Fastify compiles your routes to schema-validated handlers ahead of time and skips most of that. On a per-request basis it's not glamorous; multiplied by 25,000 req/s, it's the difference between needing four cores and needing eight.

We also use Fastify's `response-validation` with a precompiled schema for the `/check` response. That swaps `JSON.stringify` (≈ 50 µs for a small object) for a generated serializer (≈ 3 µs).

## HMAC is a rounding error

Node's `crypto.createHmac("sha256", key).update(body).digest()` is OpenSSL underneath. On a modern x86 core, signing or verifying a 200-byte body costs us about 2 microseconds. On the scale of a request budget, that is a rounding error. People worry about HMAC overhead because they're imagining JavaScript primitives. They shouldn't.

## We never allocate per request, where we can avoid it

`evaluate()` returns a struct from a small object pool. The HMAC signature is written into a pre-allocated `Buffer` we reuse. Pino's logger, which we use everywhere, writes JSON through a streaming serializer that doesn't allocate intermediate strings. None of this is dramatic — it's just discipline.

The result is that under sustained load, V8's young-generation GC runs are short and infrequent, which keeps the p99 latency down. (The tail is mostly GC, in any sufficiently fast Node service.)

## The throughput math, plain

A 4-vCPU VPS gives us four event-loop cores' worth of parallelism. Each core, on the workload above, sustains roughly 25,000 req/s before saturating. So one VPS handles ~100,000 req/s aggregate, which is more than every customer's traffic combined will be for quite some time.

When that stops being true, we'll add VPSes. The architecture is share-nothing — every API process can hydrate from Postgres independently — so horizontal scaling is a load-balancer config change, not a re-architecture.

## What we'd do differently with more time

Move the rule engine to a Rust binary that we shell out to via a Unix socket. The 0.5 ms in JS could probably be 0.05 ms in Rust. We haven't done it because the JS version is fast enough and shipping is the feature people pay for.
