import { Response, NextFunction } from 'express';
import {
  createTelemedicineSession,
  getTelemedicineSession,
  startSession,
  endSession,
} from './telemedicine.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';

const endSessionSchema = Joi.object({
  recordingUrl: Joi.string().optional(),
  notes: Joi.string().optional(),
});

export const createTelemedicineSessionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await createTelemedicineSession(req.params.appointmentId);
    sendSuccess(res, session, 'Telemedicine session created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getTelemedicineSessionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await getTelemedicineSession(req.params.appointmentId);
    sendSuccess(res, session, 'Telemedicine session retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const startSessionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await startSession(req.params.appointmentId);
    sendSuccess(res, session, 'Session started successfully');
  } catch (err) {
    next(err);
  }
};

export const endSessionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = endSessionSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const session = await endSession(
      req.params.appointmentId,
      value.recordingUrl,
      value.notes
    );
    sendSuccess(res, session, 'Session ended successfully');
  } catch (err) {
    next(err);
  }
};

