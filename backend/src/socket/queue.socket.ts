import { Server as SocketIOServer } from 'socket.io';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export const setupQueueSocket = (io: SocketIOServer): void => {
  const queueNamespace = io.of('/queue');

  queueNamespace.on('connection', (socket) => {
    logger.info(`Queue socket connected: ${socket.id}`);

    socket.on('join-queue', async (data: { doctorId?: string; clinicId?: string }) => {
      try {
        const room = `queue-${data.doctorId || 'all'}-${data.clinicId || 'all'}`;
        socket.join(room);
        socket.emit('joined-queue', room);

        const queue = await prisma.queueEntry.findMany({
          where: {
            doctorId: data.doctorId,
            clinicId: data.clinicId,
            status: 'waiting',
          },
          orderBy: {
            position: 'asc',
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        socket.emit('queue-update', queue);
      } catch (error) {
        logger.error('Join queue error:', error);
        socket.emit('error', { message: 'Failed to join queue' });
      }
    });

    socket.on('get-queue-status', async () => {
      try {
        if (socket.data.user.role === 'PATIENT') {
          const queueEntry = await prisma.queueEntry.findFirst({
            where: {
              patientId: socket.data.user.id,
              status: 'waiting',
            },
          });

          if (queueEntry) {
            const aheadCount = await prisma.queueEntry.count({
              where: {
                doctorId: queueEntry.doctorId,
                clinicId: queueEntry.clinicId,
                status: 'waiting',
                position: {
                  lt: queueEntry.position,
                },
              },
            });

            socket.emit('queue-status', {
              position: aheadCount + 1,
              estimatedWaitTime: aheadCount * 15,
            });
          }
        }
      } catch (error) {
        logger.error('Get queue status error:', error);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Queue socket disconnected: ${socket.id}`);
    });
  });
};

