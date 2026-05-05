import type { FastifyRequest, FastifyReply } from "fastify";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { config } from "../config.js";

export const clerk = createClerkClient({ secretKey: config.CLERK_SECRET_KEY });

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

// Two ways for the Next.js dashboard to call us:
//  1) X-Internal-Secret + X-User-Id (server-to-server, fast, no JWT verify)
//  2) Authorization: Bearer <clerk session token>  (direct from browser, verified via Clerk)
export async function requireUser(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const internal = req.headers["x-internal-secret"];
  const userIdHdr = req.headers["x-user-id"];
  if (typeof internal === "string" && internal === config.INTERNAL_SECRET && typeof userIdHdr === "string" && userIdHdr) {
    req.userId = userIdHdr;
    return;
  }

  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length);
    try {
      const payload = await verifyToken(token, { secretKey: config.CLERK_SECRET_KEY });
      if (payload.sub) {
        req.userId = payload.sub;
        return;
      }
    } catch {
      // fallthrough -> 401
    }
  }
  reply.code(401).send({ error: "unauthorized" });
}
