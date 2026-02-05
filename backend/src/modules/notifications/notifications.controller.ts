import { Response, NextFunction } from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './notifications.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';

export const getNotificationsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const result = await getNotifications({
      ...req,
      user: req.user,
    });
    sendSuccess(res, {
      notifications: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const markAsReadController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    await markNotificationAsRead(req.params.id, req.user.id);
    sendSuccess(res, { success: true });
  } catch (err) {
    next(err);
  }
};

export const markAllAsReadController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    await markAllNotificationsAsRead(req.user.id);
    sendSuccess(res, { success: true });
  } catch (err) {
    next(err);
  }
};
