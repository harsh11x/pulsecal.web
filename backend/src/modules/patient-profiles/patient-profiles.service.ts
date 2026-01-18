import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';

export const createOrUpdatePatientProfile = async (
    userId: string,
    data: {
        bloodType?: string;
        allergies?: string;
        chronicConditions?: string;
        emergencyContactId?: string;
        insuranceId?: string;
    }
) => {
    const existingProfile = await prisma.patientProfile.findUnique({
        where: { userId },
    });

    if (existingProfile) {
        return prisma.patientProfile.update({
            where: { userId },
            data,
        });
    }

    return prisma.patientProfile.create({
        data: {
            userId,
            ...data,
        },
    });
};

export const getPatientProfile = async (userId: string) => {
    const profile = await prisma.patientProfile.findUnique({
        where: { userId },
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    dateOfBirth: true,
                    profileImage: true,
                },
            },
        },
    });

    if (!profile) {
        throw new AppError('Patient profile not found', 404);
    }

    return profile;
};
