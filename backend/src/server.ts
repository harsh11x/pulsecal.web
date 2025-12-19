import http from 'http';
import app from './app';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { initializeSocket } from './config/socket';
import { setupChatSocket } from './socket/chat.socket';
import { setupQueueSocket } from './socket/queue.socket';
import { setupNotificationSocket } from './socket/notification.socket';
import { setSocketInstance } from './utils/socketEmitter';
import { logger } from './utils/logger';

const server = http.createServer(app);
const io = initializeSocket(server);

// Set socket instance for real-time notifications
setSocketInstance(io);

setupChatSocket(io);
setupQueueSocket(io);
setupNotificationSocket(io);

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await connectRedis();

    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const shutdown = async (): Promise<void> => {
  logger.info('Shutting down server...');
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();

