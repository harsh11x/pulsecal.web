import { Response, NextFunction } from 'express';
import {
  getAuditLogs,
  getSystemStats,
} from './admin.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AppError } from '../../middlewares/error.middleware';

export const getAuditLogsController = async (
  req: never,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getAuditLogs(req);
    sendPaginated(
      res,
      result.logs,
      result.pagination,
      'Audit logs retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getSystemStatsController = async (
  req: never,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await getSystemStats();
    sendSuccess(res, stats, 'System stats retrieved successfully');
  } catch (err) {
    next(err);
  }
};

