import { Response, NextFunction } from 'express';
import {
  getAuditLogs,
  getSystemStats,
  getAllClinicsWithStats,
  getClinicDetails,
  getDoctorPayouts,
} from './admin.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';

import { AuthRequest } from '../../middlewares/auth.middleware';

export const getAuditLogsController = async (
  req: AuthRequest,
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
  _req: AuthRequest,
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

export const getAllClinicsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getAllClinicsWithStats(req);
    sendPaginated(
      res,
      result.clinics,
      result.pagination,
      'Clinics retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getClinicDetailsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clinic = await getClinicDetails(req.params.id);
    sendSuccess(res, clinic, 'Clinic details retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getDoctorPayoutsController = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doctors = await getDoctorPayouts();
    sendSuccess(res, { doctors }, 'Doctor payout details retrieved successfully');
  } catch (err) {
    next(err);
  }
};
