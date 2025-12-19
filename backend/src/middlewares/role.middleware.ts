import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { sendError } from '../utils/apiResponse';
import { USER_ROLES } from '../utils/constants';

type Role = typeof USER_ROLES[keyof typeof USER_ROLES];

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return sendError(
        res,
        'Insufficient permissions',
        403
      );
    }

    next();
  };
};

export const requirePatient = requireRole(USER_ROLES.PATIENT);
export const requireDoctor = requireRole(USER_ROLES.DOCTOR);
export const requireReceptionist = requireRole(USER_ROLES.RECEPTIONIST);
export const requireAdmin = requireRole(USER_ROLES.ADMIN);
export const requireDoctorOrReceptionist = requireRole(
  USER_ROLES.DOCTOR,
  USER_ROLES.RECEPTIONIST
);
export const requireStaff = requireRole(
  USER_ROLES.DOCTOR,
  USER_ROLES.RECEPTIONIST,
  USER_ROLES.ADMIN
);

