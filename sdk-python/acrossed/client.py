"""
Acrossed Python SDK.

Usage:
    from acrossed import Acrossed
    ac = Acrossed(api_key="ack_live_...", signing_secret="acsk_...")
    decision = ac.check(ip="1.2.3.4", method="GET", path="/login",
                        headers={"user-agent": "curl"}, query={})
    if decision.deny:
        return 403
"""
from __future__ import annotations

import hmac
import hashlib
import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any, Mapping, Optional


DEFAULT_BASE_URL = "https://api.acrossed.com"


class AcrossedError(Exception):
    """Raised on transport errors or invalid SDK arguments."""


@dataclass(frozen=True)
class Decision:
    decision: str            # "allow" | "deny"
    reason: str              # e.g. "no_rule_matched", "ip_blocked", "rate_limited"
    matched_rule: Optional[str] = None
    latency_us: Optional[int] = None

    @property
    def allow(self) -> bool:
        return self.decision == "allow"

    @property
    def deny(self) -> bool:
        return self.decision == "deny"


class Acrossed:
    """Acrossed client.

    The client is fully thread-safe and stateless aside from immutable config.
    Defaults are tuned for production: 2s timeout, fail-OPEN on transport errors
    so Acrossed downtime cannot take your app down. Set `fail_closed=True` to
    invert that for stricter security postures.
    """

    def __init__(
        self,
        api_key: str,
        signing_secret: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = 2.0,
        fail_closed: bool = False,
    ) -> None:
        if not api_key or not api_key.startswith("ack_"):
            raise AcrossedError("api_key must start with 'ack_'")
        if not signing_secret or not signing_secret.startswith("acsk_"):
            raise AcrossedError("signing_secret must start with 'acsk_'")
        self._api_key = api_key
        self._secret = signing_secret.encode("utf-8")
        self._base = base_url.rstrip("/")
        self._timeout = timeout
        self._fail_closed = fail_closed

    def check(
        self,
        ip: str = "",
        method: str = "GET",
        path: str = "/",
        headers: Optional[Mapping[str, str]] = None,
        query: Optional[Mapping[str, str]] = None,
    ) -> Decision:
        body = {
            "ip": ip,
            "method": method,
            "path": path,
            "headers": dict(headers or {}),
            "query": dict(query or {}),
        }
        # Compact, deterministic encoding so HMAC verifies byte-for-byte server-side.
        raw = json.dumps(body, separators=(",", ":"), sort_keys=False).encode("utf-8")
        ts = str(int(time.time()))
        sig = hmac.new(self._secret, f"{ts}.".encode("utf-8") + raw, hashlib.sha256).hexdigest()

        req = urllib.request.Request(
            url=f"{self._base}/check",
            data=raw,
            method="POST",
            headers={
                "content-type": "application/json",
                "x-acrossed-key": self._api_key,
                "x-acrossed-timestamp": ts,
                "x-acrossed-signature": sig,
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=self._timeout) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            try:
                payload = json.loads(e.read().decode("utf-8"))
            except Exception:
                payload = {"decision": "deny", "reason": f"http_{e.code}"}
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            if self._fail_closed:
                return Decision(decision="deny", reason=f"transport_error:{e!s}")
            return Decision(decision="allow", reason="fail_open")

        return Decision(
            decision=payload.get("decision", "deny"),
            reason=payload.get("reason", "unknown"),
            matched_rule=payload.get("matchedRule"),
            latency_us=payload.get("latencyUs"),
        )

    def check_request(self, request: Any) -> Decision:
        """Convenience helper for popular frameworks.

        Accepts any object that exposes either `.headers`, `.method`, `.path`,
        `.remote_addr` (Flask) or `.client.host`, `.url.path`, `.method`, `.headers`
        (FastAPI/Starlette). For everything else, call `.check()` directly.
        """
        method = getattr(request, "method", "GET")
        # Flask
        path = getattr(request, "path", None)
        ip = getattr(request, "remote_addr", None)
        # FastAPI / Starlette
        if path is None:
            url = getattr(request, "url", None)
            if url is not None:
                path = getattr(url, "path", "/")
        if ip is None:
            client = getattr(request, "client", None)
            if client is not None:
                ip = getattr(client, "host", None)
        # Headers normalisation
        h = getattr(request, "headers", {}) or {}
        try:
            headers = {str(k).lower(): str(v) for k, v in h.items()}
        except Exception:
            headers = {}
        # Query
        query: dict[str, str] = {}
        try:
            args = getattr(request, "args", None) or getattr(request, "query_params", None)
            if args is not None:
                query = {str(k): str(v) for k, v in args.items()}
        except Exception:
            pass

        return self.check(
            ip=ip or "",
            method=method or "GET",
            path=path or "/",
            headers=headers,
            query=query,
        )


class AsyncAcrossed:
    """Async Acrossed client. Requires aiohttp (pip install acrossed[async])."""

    def __init__(self, api_key: str, signing_secret: str,
                 base_url: str = DEFAULT_BASE_URL,
                 timeout: float = 2.0, fail_closed: bool = False) -> None:
        if not api_key or not api_key.startswith("ack_"):
            raise AcrossedError("api_key must start with 'ack_'")
        if not signing_secret or not signing_secret.startswith("acsk_"):
            raise AcrossedError("signing_secret must start with 'acsk_'")
        self._api_key = api_key
        self._secret = signing_secret.encode("utf-8")
        self._base = base_url.rstrip("/")
        self._timeout = timeout
        self._fail_closed = fail_closed
        # Keep a sync fallback in case aiohttp is not installed
        self._sync = Acrossed(api_key, signing_secret, base_url, timeout, fail_closed)

    async def check(self, ip: str = "", method: str = "GET", path: str = "/",
                    headers: Optional[Mapping[str, str]] = None,
                    query: Optional[Mapping[str, str]] = None) -> Decision:
        import asyncio
        # Run sync urllib in thread pool — no extra deps required
        return await asyncio.get_event_loop().run_in_executor(
            None, lambda: self._sync.check(ip, method, path, headers, query)
        )

    async def check_request(self, request: Any) -> Decision:
        return await asyncio.get_event_loop().run_in_executor(
            None, lambda: self._sync.check_request(request)
        )
