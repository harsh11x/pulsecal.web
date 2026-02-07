import prisma from '../../config/database';
import admin from '../../config/firebase';
import { AppError } from '../../middlewares/error.middleware';
import { logger } from '../../utils/logger';

export const createUser = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
  clinicId?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
}) => {
  // 1. Check if user exists in DB
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError('User already exists', 400);
  }

  // 2. Create user in Firebase
  let firebaseUid: string;
  try {
    const firebaseUser = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      emailVerified: data.isEmailVerified || false,
      displayName: `${data.firstName} ${data.lastName}`,
      disabled: data.isActive === false,
    });
    firebaseUid = firebaseUser.uid;

    // Set custom claims for role
    await admin.auth().setCustomUserClaims(firebaseUid, { role: data.role });

  } catch (error: any) {
    // If user already exists in Firebase but not in DB (edge case), retrieve UID
    if (error.code === 'auth/email-already-exists') {
      const userRecord = await admin.auth().getUserByEmail(data.email);
      firebaseUid = userRecord.uid;
    } else {
      throw new AppError(`Failed to create Firebase user: ${error.message}`, 500);
    }
  }

  // 3. Create user in Prisma
  const user = await prisma.user.create({
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role,
      clinicId: data.clinicId,
      isActive: data.isActive !== false,
      isEmailVerified: data.isEmailVerified || false,
      firebaseUid,
      onboardingCompleted: true,
    },
  });

  // 4. Create Profile based on role
  if (data.role === 'DOCTOR') {
    let clinicData: any = {};
    if (data.clinicId) {
      const clinic = await prisma.clinic.findUnique({
        where: { id: data.clinicId }
      });
      if (clinic) {
        clinicData = {
          clinicName: clinic.name,
          clinicAddress: clinic.address,
          clinicLatitude: clinic.latitude ? Number(clinic.latitude) : null,
          clinicLongitude: clinic.longitude ? Number(clinic.longitude) : null,
          subscriptionStatus: 'ACTIVE',
          subscriptionPlan: clinic.subscriptionPlan,
        };
      }
    }

    await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        licenseNumber: `LIC-${user.id.substring(0, 8)}`,
        specialization: 'General',
        clinicName: clinicData.clinicName || 'My Clinic',
        clinicAddress: clinicData.clinicAddress,
        clinicLatitude: clinicData.clinicLatitude,
        clinicLongitude: clinicData.clinicLongitude,
        subscriptionStatus: clinicData.subscriptionStatus || 'PENDING',
        subscriptionPlan: clinicData.subscriptionPlan || 'BASIC',
        consultationFee: 0,
      },
    });
  }

  return user;
};

export const getProfile = async (userId: string) => {
  try {
    logger.info({ userId }, 'Fetching profile from database');
    
    if (!userId || typeof userId !== 'string') {
      throw new AppError('Invalid user ID', 400);
    }

    // Fetch user with all fields (includes settings if migration has been run)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patientProfile: {
          select: {
            id: true,
            bloodType: true,
            allergies: true,
            chronicConditions: true,
          },
        },
        doctorProfile: {
          select: {
            id: true,
            specialization: true,
            clinicName: true,
            clinicAddress: true,
            consultationFee: true,
            services: true,
            workingHours: true,
            bio: true,
            subscriptionStatus: true,
            subscriptionPlan: true,
            subscriptionExpiresAt: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn({ userId }, 'User not found in database');
      throw new AppError('User not found', 404);
    }

    const { password, mfaSecret, emailVerificationToken, passwordResetToken, ...safeUser } = user;

    let canManageSubscription = false;
    if (user.role === 'DOCTOR' || user.role === 'ADMIN') {
      if (user.role === 'ADMIN') canManageSubscription = true;
      else if (!user.clinicId) canManageSubscription = true;
      else {
        try {
          const clinic = await prisma.clinic.findUnique({ where: { id: user.clinicId }, select: { ownerId: true } });
          if (!clinic?.ownerId || clinic.ownerId === userId) {
            canManageSubscription = true;
          } else {
            const doctorCount = await prisma.user.count({ where: { clinicId: user.clinicId, role: 'DOCTOR' } });
            if (doctorCount === 1) {
              canManageSubscription = true;
              await prisma.clinic.update({ where: { id: user.clinicId }, data: { ownerId: userId } });
            }
          }
        } catch (e: any) {
          if (e?.message?.includes('ownerId') && e?.message?.includes('does not exist')) canManageSubscription = true;
        }
      }
    }

    logger.info({ userId, role: user.role }, 'Profile retrieved successfully');
    return { ...safeUser, canManageSubscription };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error(
      { 
        error: error.message, 
        stack: error.stack,
        userId,
        errorName: error.name,
        errorCode: error.code
      }, 
      'Error in getProfile service'
    );
    throw new AppError(`Failed to fetch profile: ${error.message}`, 500);
  }
};

export const updateProfile = async (
  userId: string,
    data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: Date | null;
    profileImage?: string;
    clinicAddress?: string;
    specialization?: string;
    bio?: string;
    consultationFee?: number;
    services?: string[];
    workingHours?: any;
    clinicName?: string;
    bankAccountDetails?: string | null;
    upiId?: string | null;
  }
) => {
  try {
    logger.info({ userId, fields: Object.keys(data) }, 'Updating profile');

    // Extract doctor profile specific fields
    const {
      clinicAddress,
      specialization,
      bio,
      consultationFee,
      services,
      workingHours,
      clinicName,
      bankAccountDetails,
      upiId,
      ...userData
    } = data;

    // Update user data
    const user = await prisma.user.update({
      where: { id: userId },
      data: userData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        role: true,
        profileImage: true,
        updatedAt: true,
        doctorProfile: true,
      },
    });

    // If ANY doctor specific fields are provided and user is a doctor, update the doctor profile
    if (
      user.role === 'DOCTOR' &&
      (clinicAddress !== undefined ||
        specialization !== undefined ||
        bio !== undefined ||
        consultationFee !== undefined ||
        services !== undefined ||
        workingHours !== undefined ||
        clinicName !== undefined ||
        bankAccountDetails !== undefined ||
        upiId !== undefined)
    ) {
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId },
      });

      if (doctorProfile) {
        await prisma.doctorProfile.update({
          where: { userId },
          data: {
            clinicAddress,
            specialization,
            bio,
            consultationFee,
            services,
            workingHours,
            clinicName,
            bankAccountDetails,
            upiId,
          },
        });
      } else {
        // Create if it doesn't exist
        await prisma.doctorProfile.create({
          data: {
            userId,
            licenseNumber: `LIC-${userId.substring(0, 8)}`,
            specialization: specialization || 'General',
            clinicName: clinicName || 'My Clinic',
            clinicAddress,
            bio,
            consultationFee: consultationFee || 0,
            services: services || [],
            workingHours: workingHours,
          },
        });
      }
    }

    logger.info({ userId }, 'Profile updated successfully');
    return user;
  } catch (error: any) {
    logger.error(
      { 
        error: error.message, 
        stack: error.stack,
        userId 
      }, 
      'Error in updateProfile service'
    );
    throw error;
  }
};

export const getAllUsers = async (req: any) => {
  try {
    const { page = 1, limit = 10 } = req.query || {};
    const { role, search } = req.query || {};
    
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (role) {
      // Handle case-insensitive role matching
      where.role = (role as string).toUpperCase();
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    logger.info({ where, pageNum, limitNum }, 'Fetching users with filters');

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          clinicId: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    logger.info({ count: users.length, total }, 'Users fetched successfully');

    return {
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Error in getAllUsers service');
    throw error;
  }
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      profileImage: true,
      createdAt: true,
      patientProfile: true,
      doctorProfile: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

export const updateUserStatus = async (
  userId: string,
  isActive: boolean
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });

  return user;
};
