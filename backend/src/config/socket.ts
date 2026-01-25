import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

import { logger } from '../utils/logger';

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  // Get CORS origin from environment, support multiple origins
  const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'https://www.pulsecal.com';
  const allowedOrigins = corsOrigin.includes(',')
    ? corsOrigin.split(',').map(o => o.trim())
    : [corsOrigin];

  logger.info({ allowedOrigins }, 'Socket.IO CORS Configuration');

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        const isAllowed = allowedOrigins.some(allowed => {
          // Exact match
          if (origin === allowed) return true;
          // Wildcard subdomain match
          if (allowed.startsWith('*.')) {
            const domain = allowed.slice(2);
            return origin.endsWith(domain);
          }
          return false;
        });
        
        if (isAllowed) {
          callback(null, true);
        } else {
          logger.warn(`Socket.IO CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type'],
    },
    transports: ['websocket', 'polling'],
    // Allow connections from HTTPS frontend even if backend is HTTP (behind load balancer)
    allowEIO3: true,
    // Handle proxy/load balancer
    pingTimeout: 60000,
    pingInterval: 25000,
    // Allow upgrade from HTTP to WebSocket
    allowUpgrades: true,
  });

  /*
  const pubClient = redisClient;
  const subClient = redisClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));
  */

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const admin = require('./firebase').default;
      const decodedToken = await admin.auth().verifyIdToken(token);

      const prisma = require('./database').default;
      const user = await prisma.user.findFirst({
        where: { firebaseUid: decodedToken.uid },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          firebaseUid: true,
        },
      });

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Invalid user'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      logger.error(error, 'Socket authentication error');
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.data.user?.email})`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });

    socket.on('error', (error: Error) => {
      logger.error(error, `Socket error for ${socket.id}`);
    });
  });

  return io;
};

