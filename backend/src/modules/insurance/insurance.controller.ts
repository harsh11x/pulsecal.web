import { Response, NextFunction } from 'express';
import {
  createOrUpdateInsurance,
  getInsurance,
  deleteInsurance,
} from './insurance.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';

const insuranceSchema = Joi.object({
  providerName: Joi.string().required(),
  policyNumber: Joi.string().required(),
  groupNumber: Joi.string().optional(),
  sensitiveData: Joi.string().optional(),
  coverageStartDate: Joi.date().optional(),
  coverageEndDate: Joi.date().optional(),
});

export const createOrUpdateInsuranceController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = insuranceSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const insurance = await createOrUpdateInsurance({
      patientId: req.user.id,
      ...value,
    });
    sendSuccess(res, insurance, 'Insurance updated successfully');
  } catch (err) {
    next(err);
  }
};

export const getInsuranceController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const insurance = await getInsurance(req.user.id);
    sendSuccess(res, insurance, 'Insurance retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteInsuranceController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const result = await deleteInsurance(req.user.id);
    sendSuccess(res, result, 'Insurance deleted successfully');
  } catch (err) {
    next(err);
  }
};

