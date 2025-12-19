import { Server as SocketIOServer } from 'socket.io';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export const setupChatSocket = (io: SocketIOServer): void => {
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket) => {
    logger.info(`Chat socket connected: ${socket.id}`);

    socket.on('join-room', async (roomId: string) => {
      try {
        const room = await prisma.chatRoom.findFirst({
          where: {
            id: roomId,
            users: {
              some: {
                id: socket.data.user.id,
              },
            },
          },
        });

        if (room) {
          socket.join(roomId);
          socket.emit('joined-room', roomId);
          logger.info(`User ${socket.data.user.id} joined room ${roomId}`);
        } else {
          socket.emit('error', { message: 'Room not found' });
        }
      } catch (error) {
        logger.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('send-message', async (data: {
      roomId: string;
      type: string;
      content: string;
      fileUrl?: string;
      fileName?: string;
    }) => {
      try {
        const message = await prisma.chatMessage.create({
          data: {
            roomId: data.roomId,
            senderId: socket.data.user.id,
            type: data.type as 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM',
            content: data.content,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        await prisma.chatRoom.update({
          where: { id: data.roomId },
          data: { updatedAt: new Date() },
        });

        chatNamespace.to(data.roomId).emit('new-message', message);
        logger.info(`Message sent in room ${data.roomId}`);
      } catch (error) {
        logger.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('mark-read', async (roomId: string) => {
      try {
        await prisma.chatMessage.updateMany({
          where: {
            roomId,
            senderId: { not: socket.data.user.id },
            isRead: false,
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });

        chatNamespace.to(roomId).emit('messages-read', {
          roomId,
          userId: socket.data.user.id,
        });
      } catch (error) {
        logger.error('Mark read error:', error);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Chat socket disconnected: ${socket.id}`);
    });
  });
};

