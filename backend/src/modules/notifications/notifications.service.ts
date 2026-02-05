import prisma from '../../config/database';
import { getPaginationParams } from '../../utils/helpers';
import { NotificationType } from '@prisma/client';

export const getNotifications = async (req: {
  query: { page?: string; limit?: string; isRead?: string };
  user?: { id: string };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);

  const where: { userId: string; isRead?: boolean } = {
    userId: req.user!.id,
  };

  if (req.query.isRead !== undefined) {
    where.isRead = req.query.isRead === 'true';
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createNotification = async (data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) => {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: (data.metadata ?? undefined) as object | undefined,
    },
  });
};

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
) => {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
};
