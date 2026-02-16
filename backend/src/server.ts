import http from 'http';
import app from './app';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { initializeSocket } from './config/socket';
import { setupChatSocket } from './socket/chat.socket';
import { setupQueueSocket } from './socket/queue.socket';
import { setupNotificationSocket } from './socket/notification.socket';
import { setSocketInstance } from './utils/socketEmitter';
import { logger } from './utils/logger';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);
setSocketInstance(io);

// Setup Socket Namespaces/Events
setupChatSocket(io);
setupQueueSocket(io);
setupNotificationSocket(io);

// Graceful Shutdown Handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  const shutdownPromise = new Promise<void>((resolve) => {
    server.close(() => {
      logger.info('HTTP server closed.');
      resolve();
    });
  });

  try {
    // 1. Close HTTP Server (stop accepting new requests)
    await shutdownPromise;

    // 2. Perform cleanup (DB, Redis, etc.)
    await Promise.all([
      disconnectDatabase(),
      disconnectRedis().catch(err => logger.warn({ err }, 'Redis disconnect failed')),
    ]);

    logger.info('Database and Redis connections closed.');
    logger.info('Graceful shutdown completed.');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Error during graceful shutdown');
    process.exit(1);
  }
};

// Start Server
const startServer = async () => {
  try {
    logger.info('Initializing PulseCal Backend...');

    // 1. Connect to Database
    await connectDatabase();
    logger.info('Database connected successfully.');

    // 2. Connect to Redis
    try {
      await connectRedis();
      logger.info('Redis connected successfully.');
    } catch (err) {
      logger.warn({ err }, 'Redis connection failed. Continuing without Redis.');
      // process.exit(1); // Continuing without Redis for now
    }

    // 3. Start HTTP Listener with Port Fallback
    const startListener = (port: number) => {
      const serverInstance = server.listen(port, () => {
        logger.info(`Server listening on port ${port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
        logger.info(`API Version: ${config.apiVersion}`);
      });

      serverInstance.on('error', (e: any) => {
        if (e.code === 'EADDRINUSE') {
          logger.warn(`Port ${port} is in use, trying ${port + 1}...`);
          serverInstance.close();
          startListener(port + 1);
        } else {
          logger.error({ err: e }, 'Server error');
          process.exit(1);
        }
      });
    };

    startListener(Number(config.port));

  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

// Handle System Signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle Uncaught Errors
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught Exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled Rejection');
  process.exit(1);
});

// Boot the server
startServer();
