import { createHash, randomBytes } from "node:crypto";

// Public key shape: ack_live_<32 url-safe chars>. Shown once.
export function generateApiKey(): string {
  return `ack_live_${randomBytes(24).toString("base64url")}`;
}

// Signing secret used by SDK to compute HMAC. Shown once.
export function generateSigningSecret(): string {
  return `acsk_${randomBytes(32).toString("base64url")}`;
}

export function hashKey(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}
