# Acrossed — Python SDK

Sub-millisecond rule enforcement for any Python backend. AES-256-GCM rules at rest, HMAC-SHA256 signed requests in flight.

## Install

```bash
pip install acrossed
```

## Quick start

```python
from acrossed import Acrossed

ac = Acrossed(
    api_key="ack_live_xxxxxxxx",            # from https://acrossed.com/dashboard
    signing_secret="acsk_xxxxxxxx",
)

decision = ac.check(
    ip="203.0.113.10",
    method="POST",
    path="/login",
    headers={"user-agent": "curl/8"},
    query={},
)

if decision.deny:
    print("blocked:", decision.reason)
```

## Flask

```python
from flask import Flask, request, abort
from acrossed import Acrossed

app = Flask(__name__)
ac = Acrossed(api_key="ack_live_...", signing_secret="acsk_...")

@app.before_request
def gate():
    d = ac.check_request(request)
    if d.deny:
        abort(403, d.reason)
```

## FastAPI

```python
from fastapi import FastAPI, Request, HTTPException
from acrossed import Acrossed

app = FastAPI()
ac = Acrossed(api_key="ack_live_...", signing_secret="acsk_...")

@app.middleware("http")
async def gate(req: Request, call_next):
    d = ac.check_request(req)
    if d.deny:
        raise HTTPException(status_code=403, detail=d.reason)
    return await call_next(req)
```

## Failure mode

By default the SDK **fails open** — if the Acrossed API is unreachable, requests are allowed through so an outage on our side cannot take your app down.

For stricter postures, pass `fail_closed=True`:

```python
ac = Acrossed(api_key=..., signing_secret=..., fail_closed=True)
```
