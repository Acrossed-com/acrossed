# Acrossed

Cryptographic rule enforcement engine across systems.

```
api/  — Fastify rule engine (port 4000)
web/  — Next.js 15 dashboard + landing (port 3001)
sdk/  — `acrossed` npm package
```

Run with PM2: `pm2 start ecosystem.config.js`. Reverse-proxied by Caddy.
