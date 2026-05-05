# Acrossed — Customer Setup Guide

Welcome. This guide walks you through everything you need to do **after** you download the SDK bundle from your VPS, from picking up an API key to wiring custom domains.

---

## 1. What's in the bundle

The tarball you downloaded from `/srv/acrossed-private/acrossed-bundle-v1.tar.gz` contains:

```
acrossed-bundle/
├── sdk-js/              # NPM-publishable TypeScript SDK
├── sdk-python/          # pip-installable Python SDK
├── sdk-go/              # go get-able Go SDK
└── SETUP_GUIDE.md       # this file
```

Each SDK has its own `README.md` with language-specific examples.

---

## 2. Get your API credentials

1. Go to **https://acrossed.com**, sign up (or sign in).
2. Click **Dashboard → Create project**.
3. Name your project — e.g. `prod-api`.
4. **Copy both values shown — they are displayed once and never again:**
   - `apiKey` — starts with `ack_live_…`
   - `signingSecret` — starts with `acsk_…`
5. Note your **default URL** — every project gets a free TLS-secured subdomain at `https://<your-slug>.acrsd.dev`. You can find it on the project page.

> **Lost your keys?** Go to the project page and click **Rotate keys** — both values regenerate.

Store the keys in your environment, never in source:

```bash
export ACROSSED_KEY="ack_live_xxxxxxxx"
export ACROSSED_SECRET="acsk_xxxxxxxx"
```

---

## 3. Install the SDK in your app

### JavaScript / TypeScript / Node

```bash
cd sdk-js
npm pack             # produces acrossed-1.0.0.tgz
# in your app:
npm install /path/to/acrossed-1.0.0.tgz
# (or publish privately to your registry)
```

```ts
import { Acrossed } from "acrossed";

const ac = new Acrossed({
  apiKey: process.env.ACROSSED_KEY!,
  signingSecret: process.env.ACROSSED_SECRET!,
});

// Express
app.use(async (req, res, next) => {
  const d = await ac.check(req);
  if (d.deny) return res.status(403).send(d.reason);
  next();
});
```

### Python

```bash
cd sdk-python
pip install .
```

```python
from acrossed import Acrossed
from flask import Flask, request, abort

ac = Acrossed(
    api_key=os.environ["ACROSSED_KEY"],
    signing_secret=os.environ["ACROSSED_SECRET"],
)
app = Flask(__name__)

@app.before_request
def gate():
    d = ac.check_request(request)
    if d.deny:
        abort(403, d.reason)
```

### Go

```bash
cd sdk-go
# In your app go.mod, add a `replace` directive pointing to this folder
# OR push it to your private git remote and `go get` it.
```

```go
client, _ := acrossed.New(acrossed.Config{
    APIKey:        os.Getenv("ACROSSED_KEY"),
    SigningSecret: os.Getenv("ACROSSED_SECRET"),
})
http.Handle("/", gate(client, mux))
```

---

## 4. Build your first rule

In the dashboard, open your project and add rules. Each rule is a JSON object. Examples:

**Block specific IPs**
```json
{ "ip_block": ["203.0.113.10", "198.51.100.0/24"], "action": "deny", "reason": "blocklisted" }
```

**Block countries (Pro+)**
```json
{ "country_block": ["RU", "KP"], "action": "deny", "reason": "geo_blocked" }
```

**Rate-limit per IP**
```json
{ "match": { "path": "/login" }, "limit": { "requests": 10, "window": "1m", "by": "ip" } }
```

**Require an internal header**
```json
{ "match": { "path": "/admin/*" }, "require_header": "x-internal-token", "action": "deny" }
```

**Time-window allow**
```json
{ "match": { "path": "/checkout" }, "time": { "after": "09:00", "before": "21:00", "days": [1,2,3,4,5] } }
```

Combine rules — they're evaluated top-to-bottom. The first match wins. Empty rules → allow.

---

## 5. Default subdomain (`<slug>.acrsd.dev`)

Every project automatically gets a public subdomain like `https://swift-iron-a3f4.acrsd.dev` that:

- Is fully TLS-secured (Let's Encrypt, on-demand issuance, < 5s)
- Renders a "Protected by Acrossed" landing page bound to your project
- Is the default destination if you have no custom domain attached

You don't have to configure anything — DNS and TLS are handled by the platform.

---

## 6. Attach a custom domain (Pro+)

If you want users to see your own domain instead of `<slug>.acrsd.dev`:

1. Open **Dashboard → your project → Custom domains → Add**.
2. Enter `api.your-company.com` (or whatever subdomain you want).
3. The dashboard returns a CNAME instruction:

   ```
   Type:  CNAME
   Name:  api.your-company.com
   Value: edge.acrsd.dev
   ```

4. Add that CNAME at your DNS provider (Cloudflare, Namecheap, Route53, etc).
5. Visit `https://api.your-company.com` — Caddy mints a fresh Let's Encrypt cert on the first hit, usually under 5 seconds.

> **Why a CNAME and not an A record?** CNAME means we can rotate edge IPs invisibly to you. The `edge.acrsd.dev` endpoint always points to the latest live edge.

---

## 7. Pricing tiers

| | Free | Pro ($29/mo) | Enterprise ($499/mo) |
|---|---|---|---|
| Decisions / month | 10,000 | 1,000,000 | 100,000,000 |
| Active rules | 5 | 100 | 5,000 |
| Custom domains | — | 3 | 50 |
| Geo blocking | — | ✓ | ✓ |
| SSO / SAML | — | — | ✓ |
| SLA | — | — | 99.99% |

When you hit your monthly cap, the API responds with HTTP `402 quota_exceeded` and an `upgradeUrl`. Your SDK returns `decision: "deny"`. Upgrade in **Dashboard → Billing**.

> **Quotas reset on the 1st of each month UTC.**

---

## 8. Failure modes (very important)

By default, **all SDKs fail open** — if our API is unreachable, your requests pass through. This guarantees an Acrossed outage cannot take your app down.

If you want stricter behaviour:

```ts
new Acrossed({ apiKey, signingSecret, failClosed: true });
```
```python
Acrossed(api_key=..., signing_secret=..., fail_closed=True)
```
```go
acrossed.New(acrossed.Config{ ..., FailClosed: true })
```

---

## 9. Production checklist

- [ ] Keys live in environment variables, not in source
- [ ] You've rotated keys at least once after copy/paste
- [ ] DNS for any custom domains is propagated (`dig +short api.your-company.com`)
- [ ] Your app uses `failClosed: false` (the default) unless you've thought hard about it
- [ ] You've tested at least one deny rule against a known IP

---

## 10. Where things live

| | Endpoint |
|---|---|
| Marketing site | https://acrossed.com |
| Dashboard | https://acrossed.com/dashboard |
| API | https://api.acrossed.com |
| Default subdomains | https://`<slug>`.acrsd.dev |
| CNAME target for custom domains | `edge.acrsd.dev` |

---

## 11. Help

- Email: hello@acrossed.com
- Status: https://acrossed.com (live latency strip is real)
