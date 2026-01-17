/**
 * PulseCal Backend Server - Production Entry Point
 * 
 * NOTE: This file expects the application to be built using `npm run build`.
 * It imports compiled artifacts from the ./dist directory.
 */

require('dotenv').config();
const http = require('http');
const { logger } = require('./dist/utils/logger'); // Import configured logger

// Global Error Handlers (Fail Fast)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥', err);
  process.exit(1);
});

// Import Compiled App & Configs
const app = require('./dist/app').default;
const { config } = require('./dist/config/env');
const { connectDatabase, disconnectDatabase } = require('./dist/config/database');
const { connectRedis, disconnectRedis } = require('./dist/config/redis');
const { initializeSocket } = require('./dist/config/socket');
const { setupChatSocket } = require('./dist/socket/chat.socket');
const { setupQueueSocket } = require('./dist/socket/queue.socket');
const { setupNotificationSocket } = require('./dist/socket/notification.socket');
const { setSocketInstance } = require('./dist/utils/socketEmitter');

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================
const startServer = async () => {
  try {
    logger.info('Initializing PulseCal Production Server...');

    // 1. Connect to Infrastructure
    await connectDatabase();

    // Redis is optional but recommended
    try {
      await connectRedis();
    } catch (err) {
      logger.error('Redis connection failed (Continuing without Redis)', err);
    }

    // 2. Create HTTP Server
    const server = http.createServer(app);

    // 3. Initialize Socket.IO
    const io = initializeSocket(server);
    setSocketInstance(io);

    // 4. Setup Socket Namespaces
    setupChatSocket(io);
    setupQueueSocket(io);
    setupNotificationSocket(io);

    // 5. Start Listening
    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    // ============================================================================
    // GRACEFUL SHUTDOWN
    // ============================================================================
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed.');

        try {
          await Promise.all([
            disconnectDatabase(),
            disconnectRedis().catch(err => logger.warn({ err }, 'Redis disconnect failed')),
          ]);
          logger.info('All connections closed.');
          process.exit(0);
        } catch (err) {
          logger.error({ err }, 'Error during cleanup');
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
