import { Response, NextFunction } from 'express';
import {
  getAuditLogs,
  getSystemStats,
  getAllClinicsWithStats,
  getClinicDetails,
  getDoctorPayouts,
  adminSetClinicStatus,
  adminDeleteClinic,
  adminSetUserStatus,
} from './admin.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AppError } from '../../middlewares/error.middleware';
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

export const setClinicStatusController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      throw new AppError('isActive must be a boolean', 400);
    }
    const clinic = await adminSetClinicStatus(req.params.id, isActive);
    sendSuccess(
      res,
      clinic,
      isActive ? 'Clinic activated successfully' : 'Clinic suspended successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const deleteClinicAdminController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await adminDeleteClinic(req.params.id);
    sendSuccess(res, result, 'Clinic deleted successfully');
  } catch (err) {
    next(err);
  }
};

export const setUserStatusAdminController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) throw new AppError('User not authenticated', 401);
    const { isActive, permanent } = req.body;
    if (typeof isActive !== 'boolean') {
      throw new AppError('isActive must be a boolean', 400);
    }
    const user = await adminSetUserStatus(
      req.user.id,
      req.params.id,
      isActive,
      permanent === true
    );
    sendSuccess(
      res,
      user,
      isActive
        ? 'User activated successfully'
        : permanent
          ? 'User deleted successfully'
          : 'User suspended successfully'
    );
  } catch (err) {
    next(err);
  }
};
