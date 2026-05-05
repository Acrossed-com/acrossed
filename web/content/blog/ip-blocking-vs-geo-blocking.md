---
title: IP blocking vs geo blocking — when to use each
description: They sound similar but solve different problems. Here's when each one belongs in your ruleset and what its failure modes look like.
author: Acrossed Team
date: 2026-04-25
---

IP blocking and geo blocking are both deny rules, but they're aimed at different threat models. Using the wrong one is either too blunt or not blunt enough.

## IP blocking: specific, surgical, fragile

```json
{ "ip_block": ["203.0.113.10", "198.51.100.0/24"], "action": "deny" }
```

You're naming exact addresses or CIDR ranges. Precise — but brittle. An attacker with a pool of IPs just rotates to the next one.

**Use IP blocking when:**
- You have a specific bad actor whose IP you know from logs or a WAF alert
- You want to block a known data-center CIDR with no legitimate users
- You're building an allow-list of known-good IPs (office VPN, partner services)

**Don't use IP blocking for:**
- Stopping broad bot traffic — bots rotate IPs faster than you can list them
- Long-term protection — residential proxies make source IPs meaningless

## Geo blocking: blunt, durable, honest

```json
{ "country_block": ["RU", "KP", "CN"], "action": "deny", "reason": "geo_blocked" }
```

You're blocking by ISO country code. Coarser than an IP block but holds against IP rotation — an attacker in a blocked country has to route through a VPN exit node in another country.

**Use geo blocking when:**
- You don't operate in certain markets and the only traffic from there is fraudulent
- Compliance requires blocking specific jurisdictions
- You want to protect `/admin` or `/checkout` that legitimate users only access from known regions

**Failure modes to know:**
- VPNs and proxies bypass it trivially
- Some legitimate users (travelers, expats) will be caught
- Geo data is only as accurate as the IP-to-country database

## Combining both

```json
[
  {
    "id": "admin-ip-allow",
    "priority": 0,
    "match": { "path": "/admin" },
    "ip_allow": ["203.0.113.10"],
    "action": "allow"
  },
  {
    "id": "admin-country",
    "priority": 1,
    "match": { "path": "/admin" },
    "country_allow": ["US", "DE", "GB"],
    "reason": "country_not_permitted"
  }
]
```

Rule 0: your office IP is unconditionally allowed. Rule 1: everyone else must be in one of those three countries.

## The honest bottom line

Both are friction, not guarantees. The value is stopping the 95% of abusive traffic that comes from unsophisticated bots that don't rotate IPs or use region-specific proxies. Pair them with rate limiting and header enforcement for the full picture.
