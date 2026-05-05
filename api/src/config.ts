import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),

  // 32-byte hex master key used to wrap rule blobs and api keys at rest (AES-256-GCM)
  MASTER_KEY_HEX: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "MASTER_KEY_HEX must be 64 hex chars (32 bytes)"),

  // Internal shared secret between web (Next.js) <-> api (Fastify)
  INTERNAL_SECRET: z.string().min(16),

  // Clerk - used to verify Authorization Bearer JWTs from the dashboard
  CLERK_SECRET_KEY: z.string().min(8),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),

  // Polar
  POLAR_ACCESS_TOKEN: z.string().optional(),
  POLAR_WEBHOOK_SECRET: z.string().optional(),

  // Request signing tolerance (seconds)
  HMAC_TIMESTAMP_TOLERANCE_SEC: z.coerce.number().default(10),
});

export const config = schema.parse(process.env);
export type Config = z.infer<typeof schema>;
