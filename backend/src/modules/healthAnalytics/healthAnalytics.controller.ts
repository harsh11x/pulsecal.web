import { Response, NextFunction } from 'express';
import {
  createHealthMetric,
  getHealthMetrics,
  getHealthMetricById,
  updateHealthMetric,
  deleteHealthMetric,
} from './healthAnalytics.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';

const metricSchema = Joi.object({
  metricType: Joi.string().required(),
  value: Joi.number().required(),
  unit: Joi.string().optional(),
  notes: Joi.string().optional(),
  recordedAt: Joi.date().optional(),
});

export const createHealthMetricController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = metricSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }
    const metric = await createHealthMetric({
      patientId: req.user.id,
      ...value,
    });
    sendSuccess(res, metric, 'Health metric created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getHealthMetricsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getHealthMetrics({
      ...req,
      user: req.user,
    });
    sendPaginated(
      res,
      result.metrics,
      result.pagination,
      'Health metrics retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getHealthMetricByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const metric = await getHealthMetricById(req.params.id);
    sendSuccess(res, metric, 'Health metric retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateHealthMetricController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = metricSchema.partial().validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const metric = await updateHealthMetric(req.params.id, value);
    sendSuccess(res, metric, 'Health metric updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteHealthMetricController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deleteHealthMetric(req.params.id);
    sendSuccess(res, result, 'Health metric deleted successfully');
  } catch (err) {
    next(err);
  }
};

