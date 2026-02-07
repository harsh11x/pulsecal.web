import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppError } from './error.middleware';
import prisma from '../config/database';
import { PLAN_CONFIG, SubscriptionPlan, FeatureName } from '../config/plan.config';

export const checkSubscriptionStatus = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user || !req.user.clinicId) {
            // Patients don't have a clinic - skip subscription check (list appointments, reschedule, cancel, etc.)
            if (req.user?.role?.toUpperCase?.() === 'PATIENT') return next();
            throw new AppError('Clinic information not found', 403);
        }

        const clinic = await prisma.clinic.findUnique({
            where: { id: req.user.clinicId },
        });

        if (!clinic) {
            throw new AppError('Clinic not found', 404);
        }

        // Attach clinic to request for downstream use
        (req as any).clinic = clinic;

        if (clinic.subscriptionStatus && clinic.subscriptionStatus !== 'ACTIVE') {
            throw new AppError(
                'Subscription is inactive or expired. Please upgrade to continue.',
                403
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const checkFeatureAccess = (featureName: FeatureName) => {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
        try {
            const clinic = (req as any).clinic;
            if (!clinic) {
                throw new AppError('Clinic context missing', 500);
            }

            const plan = clinic.subscriptionPlan as SubscriptionPlan;
            const config = PLAN_CONFIG[plan];

            if (!config) {
                throw new AppError('Invalid subscription plan configuration', 500);
            }

            const isAllowed = config.features[featureName];

            if (!isAllowed) {
                throw new AppError(
                    `Your current plan (${plan}) does not support this feature. Please upgrade.`,
                    403
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};


export const checkLimit = (limitName: 'maxDoctors' | 'clinicLocations' | 'maxAppointments') => {
    return async (req: AuthRequest, _res: Response, next: NextFunction) => {
        try {
            const clinic = (req as any).clinic;
            if (!clinic) {
                // If it's a patient, they might not have a clinic context in the same way, 
                // but usually this middleware is for clinic staff actions. 
                // If patient is booking, we might handle limits differently or not at all (pay per use).
                // Assuming this is for Admin/Dr actions.
                throw new AppError('Clinic context missing', 500);
            }

            const plan = clinic.subscriptionPlan as SubscriptionPlan;
            const config = PLAN_CONFIG[plan];
            if (!config) {
                throw new AppError('Invalid subscription plan configuration', 500);
            }

            const limit = config[limitName];

            // If limit is Infinity, skip check
            if (limit === Infinity) return next();

            let currentUsage = 0;

            if (limitName === 'maxDoctors') {
                currentUsage = await prisma.user.count({
                    where: {
                        clinicId: clinic.id,
                        role: 'DOCTOR',
                        isActive: true
                    }
                });
            } else if (limitName === 'maxAppointments') {
                // Count appointments for the current month
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                currentUsage = await prisma.appointment.count({
                    where: {
                        // Assuming appointments are linked to clinic via doctor
                        doctor: {
                            clinicId: clinic.id
                        },
                        scheduledAt: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        }
                    }
                });
            }
            // Add logic for clinicLocations if/when that table exists or logic is defined

            if (currentUsage >= limit) {
                throw new AppError(
                    `You have reached the limit for ${limitName} (${limit}) on your ${plan} plan. Please upgrade to add more.`,
                    403
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
