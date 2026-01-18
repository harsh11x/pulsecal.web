import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/apiResponse';
import {
    createOrUpdatePatientProfile,
    getPatientProfile,
} from './patient-profiles.service';
import { AppError } from '../../middlewares/error.middleware';

export const createPatientProfileController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const profile = await createOrUpdatePatientProfile(req.user.id, req.body);
        sendSuccess(res, profile, 'Patient profile updated successfully');
    } catch (error) {
        next(error);
    }
};

export const getPatientProfileController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        // specific route logic could allow admin/staff to view other profiles potentially
        // but for now, default to own profile
        const userId = req.params.id || req.user.id;

        // Authorization check if viewing another user's profile
        if (userId !== req.user.id && req.user.role === 'PATIENT') {
            throw new AppError('Unauthorized access', 403);
        }

        const profile = await getPatientProfile(userId);
        sendSuccess(res, profile, 'Patient profile retrieved successfully');
    } catch (error) {
        next(error);
    }
};
