import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { config } from "../config.js";

// AES-256-GCM. Format: base64( iv(12) || tag(16) || ciphertext )
const KEY = Buffer.from(config.MASTER_KEY_HEX, "hex");

export function encrypt(plaintext: string | Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const buf = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, "utf8");
  const enc = Buffer.concat([cipher.update(buf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(payload: string): Buffer {
  const raw = Buffer.from(payload, "base64");
  if (raw.length < 12 + 16 + 1) throw new Error("ciphertext too short");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

export function decryptString(payload: string): string {
  return decrypt(payload).toString("utf8");
}
