import { Response, NextFunction } from 'express';
import {
  createChatRoom,
  getChatRooms,
  getChatRoomById,
  getChatMessages,
  createChatMessage,
  markMessagesAsRead,
  deleteChatMessage,
} from './chat.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';

const createRoomSchema = Joi.object({
  userIds: Joi.array().items(Joi.string()).min(1).required(),
  name: Joi.string().optional(),
  type: Joi.string().valid('direct', 'group').optional(),
});

const createMessageSchema = Joi.object({
  type: Joi.string().valid('TEXT', 'IMAGE', 'FILE', 'SYSTEM').default('TEXT'),
  content: Joi.string().required(),
  fileUrl: Joi.string().optional(),
  fileName: Joi.string().optional(),
});

export const createChatRoomController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = createRoomSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    if (!value.userIds.includes(req.user.id)) {
      value.userIds.push(req.user.id);
    }
    const room = await createChatRoom(value);
    sendSuccess(res, room, 'Chat room created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getChatRoomsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const rooms = await getChatRooms(req.user.id);
    sendSuccess(res, rooms, 'Chat rooms retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getChatRoomByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const room = await getChatRoomById(req.params.id, req.user.id);
    sendSuccess(res, room, 'Chat room retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getChatMessagesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getChatMessages({
      ...req,
      user: req.user,
    });
    sendPaginated(
      res,
      result.messages,
      result.pagination,
      'Messages retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const createChatMessageController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = createMessageSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const message = await createChatMessage({
      roomId: req.params.roomId,
      senderId: req.user.id,
      ...value,
    });
    sendSuccess(res, message, 'Message sent successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const markMessagesAsReadController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const result = await markMessagesAsRead(
      req.params.roomId,
      req.user.id
    );
    sendSuccess(res, result, 'Messages marked as read');
  } catch (err) {
    next(err);
  }
};

export const deleteChatMessageController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deleteChatMessage(req.params.id);
    sendSuccess(res, result, 'Message deleted successfully');
  } catch (err) {
    next(err);
  }
};

