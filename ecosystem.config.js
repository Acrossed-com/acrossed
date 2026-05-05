// PM2 process manifest. Secrets are read from the per-app .env files
// (api/.env and web/.env.local) by the apps themselves; we only set
// the few things PM2 needs to launch each process here.
module.exports = {
  apps: [
    {
      name: "acrossed-api",
      cwd: "/var/www/acrossed/api",
      script: "node",
      args: "dist/index.js",
      env: { NODE_ENV: "production" },
      watch: false,
      max_memory_restart: "256M",
      restart_delay: 3000,
      log_file: "/tmp/acrossed-api.log",
      error_file: "/tmp/acrossed-api-error.log",
    },
    {
      name: "acrossed-web",
      cwd: "/var/www/acrossed/web",
      script: "node_modules/.bin/next",
      args: "start -p 3001",
      env: { NODE_ENV: "production", PORT: "3001" },
      watch: false,
      max_memory_restart: "512M",
      restart_delay: 3000,
      log_file: "/tmp/acrossed-web.log",
      error_file: "/tmp/acrossed-web-error.log",
    },
  ],
};
