import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';

export const setupNotificationSocket = (io: SocketIOServer): void => {
  const notificationNamespace = io.of('/notifications');

  notificationNamespace.on('connection', (socket) => {
    logger.info(`Notification socket connected: ${socket.id} (User: ${socket.data.user?.email})`);

    // Auto-subscribe user to their notification room
    if (socket.data.user?.id) {
      socket.join(`user-${socket.data.user.id}`);
      socket.emit('subscribed', { userId: socket.data.user.id });
      logger.info(`User ${socket.data.user.id} subscribed to notifications`);
    }

    // Subscribe to specific events
    socket.on('subscribe', (data?: { userId?: string }) => {
      const userId = data?.userId || socket.data.user?.id;
      if (userId) {
        socket.join(`user-${userId}`);
        socket.emit('subscribed', { userId });
      }
    });

    // Unsubscribe from events
    socket.on('unsubscribe', (data?: { userId?: string }) => {
      const userId = data?.userId || socket.data.user?.id;
      if (userId) {
        socket.leave(`user-${userId}`);
        socket.emit('unsubscribed', { userId });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Notification socket disconnected: ${socket.id}`);
    });
  });
};

// Helper function to send notification to a user
export const sendNotification = (
  io: SocketIOServer,
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: unknown;
  }
): void => {
  const notificationNamespace = io.of('/notifications');
  notificationNamespace.to(`user-${userId}`).emit('notification', notification);
};
