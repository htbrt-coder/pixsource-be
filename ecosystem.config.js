// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "pixsource-be",
      script: "./dist/app.js",

      // ✅ PM2 cukup 1 proses (cluster internal di-handle oleh server.ts)
      exec_mode: "fork",
      instances: 1,

      watch: false,
      max_restarts: 10,
      restart_delay: 2000,

      env_production: {
        NODE_ENV: "production",
        LOG_LEVEL: "info",
      },
    },
  ],
};
