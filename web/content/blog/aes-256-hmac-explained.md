---
title: AES-256 and HMAC-SHA256, explained for the developer in a hurry
description: What they are, why we use both, and why one without the other is half a security model.
author: Acrossed Team
date: 2026-05-01
---

You're a developer. You've shipped apps. You've vaguely heard that "AES is encryption" and "HMAC is signing" and that's about where it stops. Here's the actual story, in five minutes, framed by what Acrossed uses them for.

## AES-256 is for "nobody else can read this"

When you create a project on Acrossed, two things get written to our database:

1. Your rule JSON (the thing that says "block IP 1.2.3.4")
2. Your signing secret (the thing your SDK uses to verify our responses)

We could store both in plaintext. We don't, because if our database backup ever leaks (mistakes happen), the attacker would have your secret and your rules. So we encrypt both with AES-256-GCM before insert.

- **AES** is the cipher. It's been the U.S. federal standard since 2001 and it has not been meaningfully broken.
- **256** is the key size in bits. There are 2²⁵⁶ possible keys, which is more than the number of atoms in the observable universe. Brute force is not a thing.
- **GCM** is the *mode* — how the cipher is wired up to handle a stream of bytes longer than one block. GCM is what's called an *authenticated* mode: it doesn't just encrypt, it also produces a tag that proves the ciphertext hasn't been tampered with. If somebody flips a single bit in our database, GCM detects it on read and refuses to decrypt.

The encryption key is held in the API process's environment — never written to disk, never logged, never sent over the wire. A leaked DB backup, on its own, gives an attacker ciphertext and nothing else.

## HMAC-SHA256 is for "this came from us, unmodified"

When the API answers your SDK with `{ "decision": "allow", ... }`, anyone on the network between us and your app could in principle modify the response. They could flip an `allow` to a `deny`, or vice versa.

To prevent this, we sign every response. The signature is:

```
HMAC-SHA256(signing_secret, timestamp + ":" + response_body)
```

The SDK runs the same calculation locally (it has the same secret) and compares. If the signatures match, the response is authentic and recent. If they don't, the SDK throws.

- **HMAC** stands for *hash-based message authentication code.* It's a recipe for using a hash function (in our case SHA-256) to produce a tag that requires the secret to compute.
- **SHA-256** is the hash. It's the same hash that backs Bitcoin's mining algorithm — battle-tested, widely audited, fast.
- The **timestamp** is what stops *replay attacks* — an attacker capturing yesterday's `allow` response and replaying it today. The SDK rejects responses older than 60 seconds.

## Why you need both

AES protects data at rest. HMAC protects data in flight. Either one without the other leaves a hole.

If we used HMAC but not AES, a database leak would give the attacker your signing secret directly — they could then forge ALLOW responses at will.

If we used AES but not HMAC, an attacker on the network could modify our responses without you knowing — they could flip every DENY to an ALLOW and you'd be none the wiser.

Together, they cover the threat. The attacker on the network sees gibberish responses they can't modify undetected. The attacker who steals our DB sees ciphertext they can't decrypt without the key we hold in process memory.

## Practical implications

You don't need to think about any of this. The SDK does. But two things are worth knowing as a customer:

1. **Rotate your keys if you suspect they've been logged or shared.** The dashboard has a "rotate" button — it generates a fresh signing secret and re-encrypts everything in one shot.
2. **Don't put the signing secret in client-side code.** It belongs in your server's environment variables. If it ever ends up in a `.js` bundle delivered to a browser, anyone can forge our responses to your code.

That's the whole story. Two algorithms, one job each, both very old and very well understood. Sometimes the boring choice is the right one.
