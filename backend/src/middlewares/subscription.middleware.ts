import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppError } from './error.middleware';
import prisma from '../config/database';
import { PLAN_CONFIG, SubscriptionPlan, FeatureName } from '../config/plan.config';

export const checkSubscriptionStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user || !req.user.clinicId) {
            // If user has no clinic (e.g. PATIENT), this check might be skipped or handled differently
            // For now, if route requires subscription, we assume user MUST belong to a clinic
            if (req.user?.role === 'PATIENT') return next(); // Patients usually don't need clinic subscription checks for their own actions, but clinic ops do.
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

        if (clinic.subscriptionStatus !== 'ACTIVE') {
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
    return (req: AuthRequest, res: Response, next: NextFunction) => {
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

export const checkLimit = (limitName: 'maxDoctors' | 'clinicLocations') => {
    return async (req: AuthRequest, _res: Response, next: NextFunction) => {
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

            const limit = config[limitName];

            // Count current usage
            let currentUsage = 0;
            if (limitName === 'maxDoctors') {
                // Count active doctors linked to this clinic
                // Assuming we can count users with role DOCTOR and clinicId
                currentUsage = await prisma.user.count({
                    where: {
                        clinicId: clinic.id,
                        role: 'DOCTOR',
                        isActive: true
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
