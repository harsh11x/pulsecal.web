import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import { sendSuccess } from '../../utils/apiResponse';
import prisma from '../../config/database';
import Joi from 'joi';

const createDoctorProfileSchema = Joi.object({
    licenseNumber: Joi.string().required(),
    specialization: Joi.string().required(),
    qualifications: Joi.string().optional(),
    yearsOfExperience: Joi.number().optional(),
    bio: Joi.string().optional(),
    consultationFee: Joi.number().required(),

    // Clinic Details (Optional if joining, Required if creating)
    clinicId: Joi.string().optional(),
    clinicName: Joi.string().when('clinicId', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
    clinicAddress: Joi.string().optional(),
    clinicCity: Joi.string().optional(),
    clinicState: Joi.string().optional(),
    clinicZipCode: Joi.string().optional(),
    clinicCountry: Joi.string().optional(),
    clinicPhone: Joi.string().optional(),
    clinicEmail: Joi.string().optional(),
    clinicLatitude: Joi.number().optional(),
    clinicLongitude: Joi.number().optional(),

    services: Joi.array().items(Joi.string()).default([]),
    workingHours: Joi.object().optional(),
});

const updateDoctorProfileSchema = Joi.object({
    licenseNumber: Joi.string().optional(),
    specialization: Joi.string().optional(),
    qualifications: Joi.string().optional(),
    yearsOfExperience: Joi.number().optional(),
    bio: Joi.string().optional(),
    consultationFee: Joi.number().optional(),
    clinicPhone: Joi.string().optional(),
    clinicEmail: Joi.string().optional(),
    services: Joi.array().items(Joi.string()).optional(),
    workingHours: Joi.object().optional(),
    clinicId: Joi.string().optional(),
    bankAccountDetails: Joi.string().optional().allow('', null),
    upiId: Joi.string().optional().allow('', null),
});

export const createDoctorProfileController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { error, value } = createDoctorProfileSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const userId = req.user?.id;
        if (!userId) throw new AppError('User not authenticated', 401);

        // Check if profile already exists
        const existingProfile = await prisma.doctorProfile.findUnique({
            where: { userId },
        });

        if (existingProfile) {
            throw new AppError('Doctor profile already exists', 400);
        }

        let doctorProfile;

        // SCENARIO 1: JOINING EXISTING CLINIC
        if (value.clinicId) {
            const clinic = await prisma.clinic.findUnique({
                where: { id: value.clinicId },
                include: {
                    _count: {
                        select: { staff: true }
                    }
                }
            });

            if (!clinic) throw new AppError('Clinic not found', 404);
            if (!clinic.isActive) throw new AppError('Clinic is not active', 403);

            // Check Max Doctors Limit
            if (clinic._count.staff >= clinic.maxDoctors) {
                throw new AppError(`Clinic has reached its maximum limit of ${clinic.maxDoctors} doctors. Upgrade plan required.`, 403);
            }

            // Link User to Clinic
            await prisma.user.update({
                where: { id: userId },
                data: { clinicId: value.clinicId }
            });

            // Create Profile (ACTIVE immediately, no payment needed)
            doctorProfile = await prisma.doctorProfile.create({
                data: {
                    userId,
                    licenseNumber: value.licenseNumber,
                    specialization: value.specialization,
                    qualifications: value.qualifications,
                    yearsOfExperience: value.yearsOfExperience,
                    bio: value.bio,
                    consultationFee: value.consultationFee,
                    // Inherit clinic address for search purposes
                    clinicName: clinic.name,
                    clinicAddress: clinic.address,
                    clinicLatitude: clinic.latitude ? Number(clinic.latitude) : null,
                    clinicLongitude: clinic.longitude ? Number(clinic.longitude) : null,
                    services: value.services,
                    workingHours: value.workingHours,
                    subscriptionStatus: 'ACTIVE', // Covered by clinic plan
                    subscriptionPlan: clinic.subscriptionPlan,
                }
            });

        } else {
            // SCENARIO 2: CREATING NEW CLINIC (Solo/Admin)
            // Profile is created but Subscription is PENDING until payment flow completes
            // The actual Clinic creation happens AFTER payment in verifyingRazorpayPayment

            doctorProfile = await prisma.doctorProfile.create({
                data: {
                    userId,
                    licenseNumber: value.licenseNumber,
                    specialization: value.specialization,
                    qualifications: value.qualifications,
                    yearsOfExperience: value.yearsOfExperience,
                    bio: value.bio,
                    consultationFee: value.consultationFee,
                    clinicName: value.clinicName, // Temporary until verified
                    clinicAddress: value.clinicAddress,
                    clinicLatitude: value.clinicLatitude,
                    clinicLongitude: value.clinicLongitude,
                    services: value.services,
                    workingHours: value.workingHours,
                    subscriptionStatus: 'PENDING', // Waiting for payment
                }
            });
        }

        sendSuccess(res, doctorProfile, 'Doctor profile created successfully', 201);

    } catch (err) {
        next(err);
    }
};

export const getDoctorProfileMeController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new AppError('User not authenticated', 401);

        const profile = await prisma.doctorProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            throw new AppError('Doctor profile not found', 404);
        }

        sendSuccess(res, profile, 'Profile retrieved successfully');
    } catch (err) {
        next(err);
    }
};

export const updateDoctorProfileController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new AppError('User not authenticated', 401);

        const { error, value } = updateDoctorProfileSchema.validate(req.body);

        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const updatedProfile = await prisma.doctorProfile.update({
            where: { userId },
            data: {
                ...value,
                // Prevent updating critical subscription fields directly
                subscriptionStatus: undefined,
                subscriptionPlan: undefined
            }
        });

        sendSuccess(res, updatedProfile, 'Profile updated successfully');
    } catch (err) {
        next(err);
    }
};
