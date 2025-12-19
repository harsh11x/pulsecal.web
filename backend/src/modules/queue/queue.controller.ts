import { Response, NextFunction } from 'express';
import {
  addToQueue,
  getQueue,
  getQueueStatus,
  callNextPatient,
  completeQueueEntry,
  removeFromQueue,
} from './queue.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';

const addToQueueSchema = Joi.object({
  doctorId: Joi.string().optional(),
  clinicId: Joi.string().optional(),
});

export const addToQueueController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = addToQueueSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const queueEntry = await addToQueue({
      patientId: req.user.id,
      ...value,
    });
    sendSuccess(res, queueEntry, 'Added to queue successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getQueueController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doctorId = req.query.doctorId as string | undefined;
    const clinicId = req.query.clinicId as string | undefined;
    const queue = await getQueue(doctorId, clinicId);
    sendSuccess(res, queue, 'Queue retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getQueueStatusController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const status = await getQueueStatus(req.user.id);
    sendSuccess(res, status, 'Queue status retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const callNextPatientController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const clinicId = req.query.clinicId as string | undefined;
    const queueEntry = await callNextPatient(req.user.id, clinicId);
    sendSuccess(res, queueEntry, 'Next patient called');
  } catch (err) {
    next(err);
  }
};

export const completeQueueEntryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const queueEntry = await completeQueueEntry(req.params.id);
    sendSuccess(res, queueEntry, 'Queue entry completed');
  } catch (err) {
    next(err);
  }
};

export const removeFromQueueController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await removeFromQueue(req.params.id);
    sendSuccess(res, result, 'Removed from queue successfully');
  } catch (err) {
    next(err);
  }
};

