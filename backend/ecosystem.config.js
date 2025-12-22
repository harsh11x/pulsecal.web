module.exports = {
  apps: [{
    name: "pulsecal-backend",
    script: "./server.js",
    exec_mode: "fork",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 3001,
      // You can add other env vars here or keep them in .env
      // DATABASE_URL: "..." 
      CORS_ORIGIN: "https://pulsecal.com",
    }
  }]
};
