import prisma from '../../config/database';
import { getPaginationParams, getSortParams } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';

export const createChatRoom = async (data: {
  userIds: string[];
  name?: string;
  type?: string;
}) => {
  const room = await prisma.chatRoom.create({
    data: {
      name: data.name,
      type: data.type || 'direct',
      users: {
        connect: data.userIds.map((id) => ({ id })),
      },
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return room;
};

export const getChatRooms = async (userId: string) => {
  const rooms = await prisma.chatRoom.findMany({
    where: {
      users: {
        some: {
          id: userId,
        },
      },
      deletedAt: null,
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      messages: {
        take: 1,
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return rooms;
};

export const getChatRoomById = async (roomId: string, userId: string) => {
  const room = await prisma.chatRoom.findFirst({
    where: {
      id: roomId,
      users: {
        some: {
          id: userId,
        },
      },
    },
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!room) {
    throw new AppError('Chat room not found', 404);
  }

  return room;
};

export const getChatMessages = async (req: {
  params: { roomId: string };
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
  };
  user?: { id: string };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);
  const { orderBy, order } = getSortParams(req as never);

  const room = await prisma.chatRoom.findFirst({
    where: {
      id: req.params.roomId,
      users: {
        some: {
          id: req.user?.id,
        },
      },
    },
  });

  if (!room) {
    throw new AppError('Chat room not found', 404);
  }

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: {
        roomId: req.params.roomId,
        deletedAt: null,
      },
      skip,
      take: limit,
      orderBy: { [orderBy]: order },
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
    }),
    prisma.chatMessage.count({
      where: {
        roomId: req.params.roomId,
        deletedAt: null,
      },
    }),
  ]);

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createChatMessage = async (data: {
  roomId: string;
  senderId: string;
  type: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
}) => {
  const message = await prisma.chatMessage.create({
    data: {
      roomId: data.roomId,
      senderId: data.senderId,
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

  return message;
};

export const markMessagesAsRead = async (
  roomId: string,
  userId: string
) => {
  await prisma.chatMessage.updateMany({
    where: {
      roomId,
      senderId: { not: userId },
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { message: 'Messages marked as read' };
};

export const deleteChatMessage = async (messageId: string) => {
  await prisma.chatMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  });

  return { message: 'Message deleted successfully' };
};

