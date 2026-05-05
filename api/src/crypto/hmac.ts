import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

export interface SignedHeaders {
  timestamp: string | undefined;
  signature: string | undefined;
}

export interface VerifyResult {
  ok: boolean;
  reason?: "missing_timestamp" | "missing_signature" | "expired" | "invalid_signature";
}

// Canonical signing string: `${timestamp}.${rawBody}`
// Signature: hex(HMAC-SHA256(secret, signingString))
export function sign(secret: string, timestamp: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

export function verify(
  secret: string,
  rawBody: string,
  headers: SignedHeaders,
): VerifyResult {
  if (!headers.timestamp) return { ok: false, reason: "missing_timestamp" };
  if (!headers.signature) return { ok: false, reason: "missing_signature" };

  const ts = Number(headers.timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "missing_timestamp" };

  const nowSec = Math.floor(Date.now() / 1000);
  // ±tolerance covers clock drift on both sides.
  if (Math.abs(nowSec - ts) > config.HMAC_TIMESTAMP_TOLERANCE_SEC) {
    return { ok: false, reason: "expired" };
  }

  const expected = sign(secret, headers.timestamp, rawBody);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(headers.signature, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "invalid_signature" };
  }
  return { ok: true };
}
