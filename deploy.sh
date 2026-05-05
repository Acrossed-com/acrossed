#!/usr/bin/env bash
# One-shot deploy on the VPS. Run from /var/www/acrossed.
set -euo pipefail

cd "$(dirname "$0")"

echo "[1/5] Installing api deps…"
( cd api && npm install --no-audit --no-fund --loglevel=error )

echo "[2/5] Installing web deps…"
( cd web && npm install --no-audit --no-fund --loglevel=error )

echo "[3/5] Building web…"
( cd web && npm run build )

echo "[4/5] Installing sdk deps + building sdk…"
( cd sdk && npm install --no-audit --no-fund --loglevel=error && npm run build )

echo "[5/5] Running DB migrations…"
( cd api && npx tsx src/db/migrate.ts )

echo "Done. Restart with: pm2 startOrReload ecosystem.config.js"
