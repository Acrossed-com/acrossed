// Plain-SQL migration runner. We avoid drizzle-kit migrate at runtime to keep the
// production image lean. Edit the SQL block below to evolve the schema. Each
// statement is idempotent so running this on a fresh OR existing DB is safe.
import { pool } from "./index.js";

const SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  name text NOT NULL,
  api_key_hash text NOT NULL UNIQUE,
  api_key_encrypted text NOT NULL,
  signing_secret_encrypted text NOT NULL,
  encrypted_rules text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS projects_owner_idx ON projects(owner_id);

-- v1.1: pricing + slug + Polar columns. Run safely against existing rows.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS polar_customer_id text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS polar_subscription_id text;

UPDATE projects
   SET slug = substr(replace(id::text, '-', ''), 1, 8)
 WHERE slug IS NULL;

ALTER TABLE projects ALTER COLUMN slug SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE projects ADD CONSTRAINT projects_slug_unique UNIQUE (slug);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS projects_slug_idx ON projects(slug);

-- v1.2: optional bring-your-own log sink (per project).
ALTER TABLE projects ADD COLUMN IF NOT EXISTS log_sink_url_encrypted text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS log_sink_table text NOT NULL DEFAULT 'acrossed_decisions';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS log_sink_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS log_sink_last_error text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS log_sink_last_error_at timestamptz;

CREATE TABLE IF NOT EXISTS custom_domains (
  domain text PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS domains_project_idx ON custom_domains(project_id);

CREATE TABLE IF NOT EXISTS usage (
  project_id uuid PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  request_count bigint NOT NULL DEFAULT 0,
  allowed_count bigint NOT NULL DEFAULT 0,
  denied_count bigint NOT NULL DEFAULT 0,
  monthly_checks bigint NOT NULL DEFAULT 0,
  monthly_reset_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE usage ADD COLUMN IF NOT EXISTS monthly_checks bigint NOT NULL DEFAULT 0;
ALTER TABLE usage ADD COLUMN IF NOT EXISTS monthly_reset_at timestamptz NOT NULL DEFAULT now();
`;

async function main(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(SQL);
    await client.query("COMMIT");
    console.log("[migrate] schema applied");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
