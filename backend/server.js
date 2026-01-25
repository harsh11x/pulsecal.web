/**
 * PulseCal Backend Server - Production Entry Point
 * 
 * NOTE: This file expects the application to be built using `npm run build`.
 * It imports compiled artifacts from the ./dist directory.
 * 
 * CONFIGURED FOR AWS DEPLOYMENT:
 * - Supports HTTPS via load balancer (trust proxy enabled)
 * - CORS configured for frontend domain
 * - Socket.IO configured for HTTPS frontend
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Verify Build Exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: Build not found!');
  console.error('You are trying to run the server without building it first.');
  console.error('Please run the following command to compile the application:');
  console.error('\x1b[36m%s\x1b[0m', '  npm run build');
  process.exit(1);
}

const http = require('http');
const https = require('https');
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
// ENVIRONMENT CONFIGURATION
// ============================================================================
// Get frontend URL from environment (for CORS and Socket.IO)
const FRONTEND_URL = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'https://www.pulsecal.com';
const PORT = process.env.PORT || config.port || 3001;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Log configuration
logger.info('Server Configuration:', {
  port: PORT,
  environment: NODE_ENV,
  frontendUrl: FRONTEND_URL,
  corsOrigin: process.env.CORS_ORIGIN,
});

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

    // 2. Create HTTP/HTTPS Server
    // On AWS, SSL is typically terminated at the load balancer
    // So we run HTTP server but trust the proxy headers
    let server;
    
    // Check if SSL certificates are provided (for direct HTTPS)
    const SSL_KEY_PATH = process.env.SSL_KEY_PATH;
    const SSL_CERT_PATH = process.env.SSL_CERT_PATH;
    
    if (SSL_KEY_PATH && SSL_CERT_PATH && fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH)) {
      // Direct HTTPS server (if certificates are provided)
      const httpsOptions = {
        key: fs.readFileSync(SSL_KEY_PATH),
        cert: fs.readFileSync(SSL_CERT_PATH),
      };
      server = https.createServer(httpsOptions, app);
      logger.info('Starting HTTPS server with SSL certificates');
    } else {
      // HTTP server (SSL terminated at load balancer)
      server = http.createServer(app);
      logger.info('Starting HTTP server (SSL terminated at load balancer)');
    }

    // 3. Initialize Socket.IO with proper CORS for frontend
    // CORS is configured in initializeSocket function
    const io = initializeSocket(server);
    setSocketInstance(io);

    // 4. Setup Socket Namespaces
    setupChatSocket(io);
    setupQueueSocket(io);
    setupNotificationSocket(io);

    // 5. Start Listening
    const listenHost = process.env.LISTEN_HOST || '0.0.0.0'; // Listen on all interfaces for AWS
    server.listen(PORT, listenHost, () => {
      logger.info(`✅ Server running on ${listenHost}:${PORT}`);
      logger.info(`Environment: ${NODE_ENV}`);
      logger.info(`Frontend URL: ${FRONTEND_URL}`);
      logger.info(`Socket.IO enabled and configured for: ${FRONTEND_URL}`);
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
