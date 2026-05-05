import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { config } from "./config.js";
import { hydrate } from "./engine/store.js";
import { startUsageFlusher } from "./engine/usageBuffer.js";
import { healthRoutes } from "./routes/health.js";
import { checkRoutes } from "./routes/check.js";
import { projectRoutes } from "./routes/projects.js";
import { webhookRoutes } from "./routes/webhooks.js";
import { billingRoutes } from "./routes/billing.js";
import { domainRoutes } from "./routes/domains.js";
import { adminRoutes } from "./routes/admin.js";
import { inboxRoutes } from "./routes/inbox.js";
import { blogRoutes } from "./routes/blog.js";
import { domainMarketplaceRoutes } from "./routes/domainMarketplace.js";
import { logSinkRoutes } from "./routes/logSink.js";

const app = Fastify({
  logger: {
    level: config.NODE_ENV === "production" ? "info" : "debug",
    transport: config.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
  },
  trustProxy: true,
  bodyLimit: 1024 * 64,
});

app.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
  try {
    const raw = typeof body === "string" ? body : "";
    (req as typeof req & { rawBody?: string }).rawBody = raw;
    if (raw.length === 0) return done(null, {});
    done(null, JSON.parse(raw));
  } catch (e) {
    done(e as Error, undefined);
  }
});

await app.register(helmet, { contentSecurityPolicy: false });
await app.register(cors, { origin: true, credentials: true });

await app.register(healthRoutes);
await app.register(checkRoutes);
await app.register(projectRoutes);
await app.register(logSinkRoutes);
await app.register(billingRoutes);
await app.register(domainRoutes);
await app.register(adminRoutes);
await app.register(inboxRoutes);
await app.register(blogRoutes);
await app.register(domainMarketplaceRoutes);
await app.register(webhookRoutes);

const startedAt = Date.now();
const count = await hydrate();
app.log.info({ projects: count, ms: Date.now() - startedAt }, "rule store hydrated");
startUsageFlusher();

const port = config.API_PORT;
await app.listen({ port, host: "0.0.0.0" });
app.log.info(`acrossed-api listening on :${port}`);

const shutdown = async (sig: string) => {
  app.log.info({ sig }, "shutting down");
  await app.close();
  process.exit(0);
};
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
