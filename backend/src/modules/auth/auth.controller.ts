import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import prisma from '../../config/database';
import { sendSuccess } from '../../utils/apiResponse';
import { getProfile, updateProfile } from '../users/users.service';

export const getProfileController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }
        const profile = await getProfile(req.user.id);
        sendSuccess(res, profile, 'Profile retrieved successfully');
    } catch (err) {
        next(err);
    }
};

export const syncProfileController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { firstName, lastName, phone, dateOfBirth, profileImage, role, onboardingCompleted } = req.body;

        // Prepare update data for User model
        const userUpdateData: any = {};
        if (firstName) userUpdateData.firstName = firstName;
        if (lastName) userUpdateData.lastName = lastName;
        // Only allow role update if it's being set (during signup)
        // Security note: In a real app we might want to restrict this more
        if (role && ['PATIENT', 'DOCTOR', 'RECEPTIONIST'].includes(role)) {
            userUpdateData.role = role;
        }

        // Explicitly handle onboardingCompleted
        if (typeof onboardingCompleted === 'boolean') {
            userUpdateData.onboardingCompleted = onboardingCompleted;
        }

        // Prepare update data for Profile model
        // Note: getProfile/updateProfile service mainly handles User table + Profile tables
        // We can use updateProfile service which seems to handle this roughly

        // But we might need to update User table fields directly if updateProfile doesn't cover role
        if (Object.keys(userUpdateData).length > 0) {
            await prisma.user.update({
                where: { id: req.user.id },
                data: userUpdateData
            });
        }

        // Also call service updateProfile for other fields if needed
        // constructing profileData from body
        const profileData: any = {};
        if (phone) profileData.phone = phone;
        if (dateOfBirth) profileData.dateOfBirth = dateOfBirth;
        if (profileImage) profileData.profileImage = profileImage;

        await updateProfile(req.user.id, profileData);

        // If role changed to DOCTOR, ensure DoctorProfile exists
        if (role === 'DOCTOR') {
            const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
            if (!doctorProfile) {
                await prisma.doctorProfile.create({
                    data: {
                        userId: req.user.id,
                        licenseNumber: `LIC-${req.user.id.substring(0, 8)}`,
                        specialization: 'General',
                    }
                });
            }
        }

        // Return updated profile
        const updatedProfile = await getProfile(req.user.id);
        sendSuccess(res, updatedProfile, 'Profile synced successfully');

    } catch (err) {
        next(err);
    }
};
