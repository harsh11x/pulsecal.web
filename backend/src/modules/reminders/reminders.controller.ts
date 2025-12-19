import { Response, NextFunction } from 'express';
import {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  markReminderCompleted,
  deleteReminder,
} from './reminders.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';

const reminderSchema = Joi.object({
  prescriptionId: Joi.string().optional(),
  type: Joi.string().valid('MEDICATION', 'APPOINTMENT', 'TEST', 'GENERAL').required(),
  title: Joi.string().required(),
  description: Joi.string().optional(),
  scheduledAt: Joi.date().required(),
});

export const createReminderController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = reminderSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const reminder = await createReminder({
      patientId: req.user.id,
      ...value,
    });
    sendSuccess(res, reminder, 'Reminder created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getRemindersController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getReminders({
      ...req,
      user: req.user,
    });
    sendPaginated(
      res,
      result.reminders,
      result.pagination,
      'Reminders retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getReminderByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reminder = await getReminderById(req.params.id);
    sendSuccess(res, reminder, 'Reminder retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateReminderController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = reminderSchema.partial().validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const reminder = await updateReminder(req.params.id, value);
    sendSuccess(res, reminder, 'Reminder updated successfully');
  } catch (err) {
    next(err);
  }
};

export const markReminderCompletedController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reminder = await markReminderCompleted(req.params.id);
    sendSuccess(res, reminder, 'Reminder marked as completed');
  } catch (err) {
    next(err);
  }
};

export const deleteReminderController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deleteReminder(req.params.id);
    sendSuccess(res, result, 'Reminder deleted successfully');
  } catch (err) {
    next(err);
  }
};

