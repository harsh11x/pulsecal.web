import { Response, NextFunction } from 'express';
import { getReceptionistStats, getQueueStatus, linkReceptionistToClinic } from './receptionists.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';

export const getReceptionistStatsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const receptionistId = req.user?.id;
    if (!receptionistId) {
      throw new AppError('User not authenticated', 401);
    }

    const stats = await getReceptionistStats(receptionistId);
    sendSuccess(res, stats, 'Stats retrieved successfully');
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
    const { clinicId } = req.query;
    const queue = await getQueueStatus(clinicId as string);
    sendSuccess(res, queue, 'Queue status retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const linkReceptionistController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const receptionistId = req.user?.id;
    if (!receptionistId) {
      throw new AppError('User not authenticated', 401);
    }

    const { clinicId, verificationCode } = req.body;
    if (!clinicId) {
      throw new AppError('Clinic ID is required', 400);
    }

    const result = await linkReceptionistToClinic(receptionistId, clinicId, verificationCode);
    sendSuccess(res, result, 'Receptionist linked successfully');
  } catch (err) {
    next(err);
  }
};

