import { Response, NextFunction } from 'express';
import Joi from 'joi';
import { getReceptionistStats, getQueueStatus, linkReceptionistToClinic, registerOfflinePatient } from './receptionists.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';

const registerPatientSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  email: Joi.string().email().optional(),
  dateOfBirth: Joi.date().optional(),
});

export const registerPatientController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = registerPatientSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Ensure clinic context exists
    if (!req.user?.clinicId) {
      throw new AppError('Receptionist must belong to a clinic', 403);
    }

    const patient = await registerOfflinePatient({
      ...value,
      clinicId: req.user.clinicId
    });

    sendSuccess(res, patient, 'Patient registered successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getReceptionistStatsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const receptionistId = req.user?.id;
    const clinicId = req.user?.clinicId;
    if (!receptionistId) {
      throw new AppError('User not authenticated', 401);
    }

    const stats = await getReceptionistStats(receptionistId, clinicId);
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
    // Use receptionist's clinicId so queue is scoped to their clinic
    const clinicId = (req.query.clinicId as string) || req.user?.clinicId;
    const queue = await getQueueStatus(clinicId ?? undefined);
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
