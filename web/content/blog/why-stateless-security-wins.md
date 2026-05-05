---
title: Why stateless security wins (and why we never store your traffic)
description: A short argument for why a security layer that holds zero state about your users is, counterintuitively, more secure than one that holds everything.
author: Acrossed Team
date: 2026-04-22
---

Most security products are storage products in disguise.

You install a WAF. It logs every request. Six weeks later somebody breaks into the WAF vendor and walks out with a transcript of every request your users have ever made — bearer tokens, session cookies, query parameters, the whole thing. The original attack surface (your app) was never breached. The breach happened somewhere your users never knew existed.

The problem isn't the WAF. The problem is the model: a security layer that watches everything is, by definition, a place where everything can be stolen.

## The Acrossed model

Acrossed is structurally incapable of leaking your traffic, because we never receive your traffic.

When your app calls `/check`, you send us a fingerprint:

- **IP address** of the request
- **Method and path** (e.g. `POST /login`)
- **A handful of headers** you explicitly opt into (e.g. `User-Agent`)
- **Nothing else.** No body. No query params unless you send them. No cookies. No bearer tokens. No PII you didn't consciously hand us.

We evaluate the rules. We return ALLOW or DENY. We forget.

## "But you persist *something*, right?"

Yes — three things, all aggregated, none traceable to a user:

1. A monthly counter of how many decisions we made for your project (for billing).
2. An allow/deny breakdown (for your dashboard).
3. The encrypted JSON of your rules, which is yours by definition.

That's it. There is no log line on the planet, in any of our systems, that contains the IP or path of a request your app made yesterday. We can't show it to you, because we don't have it. We can't show it to a court, because we don't have it. We can't sell it, because we don't have it.

## What you actually get

- **A security boundary that is small enough to reason about.** You can read the entire `/check` route source in five minutes. There's no machine-learning black box, no opaque "threat intelligence", no third-party feed.
- **Compliance posture by default.** GDPR data-minimization isn't a checkbox to tick — it's the architecture.
- **No coupling to our uptime.** When we go down, the SDK fails open and your traffic passes. You don't lose your audit log because we never had it.

## When this model is the wrong fit

If you need centralised observability of every request — content inspection, body capture, full-text search across attacks — you need a different tool. Acrossed isn't a SIEM. We're the gate, not the camera.

For most apps, that trade is the right one. The number of breaches caused by "the security vendor's logging system was compromised" is, at this point, embarrassing.
