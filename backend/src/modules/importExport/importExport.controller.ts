import { Response, NextFunction } from 'express';
import {
  exportUserData,
  getExportHistory,
  deleteExport,
} from './importExport.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';

const exportSchema = Joi.object({
  exportType: Joi.string().valid('all_data', 'appointments', 'medical_records', 'prescriptions').default('all_data'),
});

export const exportUserDataController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = exportSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const result = await exportUserData(req.user.id, value.exportType);
    sendSuccess(res, result, 'Data export initiated successfully');
  } catch (err) {
    next(err);
  }
};

export const getExportHistoryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const exports = await getExportHistory(req.user.id);
    sendSuccess(res, exports, 'Export history retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteExportController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const result = await deleteExport(req.params.id, req.user.id);
    sendSuccess(res, result, 'Export deleted successfully');
  } catch (err) {
    next(err);
  }
};

