module.exports = {
  apps: [
    {
      name: 'pulsecal-backend',
      script: './server.js',
      instances: 'max', // Scale to all available CPUs
      exec_mode: 'cluster', // Enable load balancing
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      // Error handling params
      max_memory_restart: '1G',
      autorestart: true,
      exp_backoff_restart_delay: 100,
    },
  ],
};
