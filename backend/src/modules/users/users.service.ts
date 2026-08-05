import prisma from '../../config/database';
import admin from '../../config/firebase';
import { AppError } from '../../middlewares/error.middleware';
import { logger } from '../../utils/logger';
import { createFirebaseUserViaRest, changeFirebasePasswordViaRest } from '../../utils/firebaseAuthRest';
import { hashPassword } from '../../utils/encrypt';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  clinicId: true,
  isActive: true,
  isEmailVerified: true,
  firebaseUid: true,
  onboardingCompleted: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

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
  if (!data.password || data.password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  // 1. Check if user exists in DB (explicit select avoids missing-column schema drift)
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError('User already exists', 400);
  }

  // 2. Create user in Firebase (Admin SDK, with REST fallback if credentials fail)
  let firebaseUid: string;
  const displayName = `${data.firstName} ${data.lastName}`;
  try {
    const firebaseUser = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      emailVerified: data.isEmailVerified || false,
      displayName,
      disabled: data.isActive === false,
    });
    firebaseUid = firebaseUser.uid;

    // Set custom claims for role
    try {
      await admin.auth().setCustomUserClaims(firebaseUid, { role: data.role });
    } catch (claimsErr: any) {
      logger.warn(
        { email: data.email, error: claimsErr?.message },
        'Failed to set Firebase custom claims (continuing)'
      );
    }
  } catch (error: any) {
    // If user already exists in Firebase but not in DB (edge case), retrieve UID
    if (error.code === 'auth/email-already-exists') {
      const userRecord = await admin.auth().getUserByEmail(data.email);
      firebaseUid = userRecord.uid;
      if (data.password) {
        await admin.auth().updateUser(firebaseUid, {
          password: data.password,
          disabled: data.isActive === false,
          displayName,
        });
      }
      try {
        await admin.auth().setCustomUserClaims(firebaseUid, { role: data.role });
      } catch (claimsErr: any) {
        logger.warn(
          { email: data.email, error: claimsErr?.message },
          'Failed to set Firebase custom claims (continuing)'
        );
      }
    } else {
      // Admin SDK credential failures (revoked key, clock skew, etc.)
      logger.warn(
        { email: data.email, error: error?.message },
        'Firebase Admin createUser failed; trying Identity Toolkit REST fallback'
      );
      try {
        const restUser = await createFirebaseUserViaRest({
          email: data.email,
          password: data.password,
          displayName,
        });
        firebaseUid = restUser.uid;
      } catch (restErr: any) {
        const msg = String(restErr?.message || '');
        if (msg.includes('EMAIL_EXISTS')) {
          throw new AppError('User already exists in Firebase', 400);
        }
        throw new AppError(
          `Failed to create Firebase user: ${error.message}`,
          500
        );
      }
    }
  }

  // 3. Create user in Prisma
  let user;
  try {
    user = await prisma.user.create({
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
      select: SAFE_USER_SELECT,
    });
  } catch (error: any) {
    // Roll back Firebase user if DB insert fails for a newly created account
    try {
      await admin.auth().deleteUser(firebaseUid);
    } catch {
      /* ignore */
    }
    throw error;
  }

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
        workingHours: {
          defaultSettings: {
            workingHours: { start: "09:00", end: "17:00" },
            slotDuration: 30
          },
          monday: { start: "09:00", end: "17:00", isOpen: true },
          tuesday: { start: "09:00", end: "17:00", isOpen: true },
          wednesday: { start: "09:00", end: "17:00", isOpen: true },
          thursday: { start: "09:00", end: "17:00", isOpen: true },
          friday: { start: "09:00", end: "17:00", isOpen: true },
          saturday: { start: "09:00", end: "13:00", isOpen: true },
          sunday: { start: "09:00", end: "17:00", isOpen: false }
        }
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

    // Explicit select so we don't require columns that may not exist yet (e.g. settings)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firebaseUid: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        profileImage: true,
        onboardingCompleted: true,
        // Include JSON settings so notification preferences can be read on the dashboard
        settings: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        googleCalendarAccessToken: true,
        googleCalendarRefreshToken: true,
        googleCalendarTokenExpiry: true,
        googleCalendarConnected: true,
        clinicId: true,
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
            clinicLatitude: true,
            clinicLongitude: true,
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

    const { ...safeUser } = user;

    // Heal missing user.clinicId when this doctor already owns a clinic (common after
    // onboarding/payment races) so dashboard clinic edits don't fail with "Clinic ID is missing".
    let resolvedClinicId = user.clinicId;
    if (user.role === 'DOCTOR' && !resolvedClinicId) {
      try {
        const ownedClinic = await prisma.clinic.findFirst({
          where: { ownerId: userId, deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });
        if (ownedClinic?.id) {
          await prisma.$executeRaw`
            UPDATE users
            SET "clinicId" = ${ownedClinic.id},
                "updatedAt" = NOW()
            WHERE id = ${userId}
          `;
          resolvedClinicId = ownedClinic.id;
          safeUser.clinicId = ownedClinic.id;
          logger.info({ userId, clinicId: ownedClinic.id }, 'Synced missing user.clinicId from owned clinic');
        }
      } catch (e: any) {
        logger.warn({ error: e.message, userId }, 'Could not heal missing clinicId from owned clinic');
      }
    }

    let canManageSubscription = false;
    if (user.role === 'DOCTOR' || user.role === 'ADMIN') {
      if (user.role === 'ADMIN') canManageSubscription = true;
      else if (!resolvedClinicId) canManageSubscription = true;
      else {
        try {
          const clinic = await prisma.clinic.findUnique({ where: { id: resolvedClinicId }, select: { ownerId: true } });

          if (clinic?.ownerId) {
            canManageSubscription = clinic.ownerId === userId;
          } else {
            // No owner set. Identify the owner by earliest creation time (assumed HEAD doctor).
            // This handles legacy clinics where ownerId might not be set.
            const doctors = await prisma.user.findMany({
              where: { clinicId: resolvedClinicId, role: 'DOCTOR' },
              orderBy: { createdAt: 'asc' },
              take: 1
            });

            if (doctors.length > 0) {
              const owner = doctors[0];
              // Set the owner for future checks
              await prisma.clinic.update({
                where: { id: resolvedClinicId },
                data: { ownerId: owner.id }
              });

              canManageSubscription = owner.id === userId;
              logger.info({ userId, clinicId: resolvedClinicId, newOwnerId: owner.id }, 'Clinic owner auto-assigned based on earliest creation date');
            } else {
              // Should theoretically not happen if the current user is a doctor in this clinic
              canManageSubscription = false;
            }
          }
        } catch (e: any) {
          logger.error({ error: e.message, userId }, 'Error checking clinic ownership');
          // Start safe: deny access if error occurs
          canManageSubscription = false;
        }
      }
    }

    logger.info({ userId, role: user.role }, 'Profile retrieved successfully');
    return { ...safeUser, clinicId: resolvedClinicId ?? safeUser.clinicId, canManageSubscription };
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
    clinicStreet?: string;
    clinicCity?: string;
    clinicState?: string;
    clinicZipCode?: string;
    clinicCountry?: string;
    specialization?: string;
    bio?: string;
    consultationFee?: number;
    services?: string[];
    workingHours?: any;
    clinicName?: string;
    clinicLatitude?: number | null;
    clinicLongitude?: number | null;
    bankAccountDetails?: string | null;
    upiId?: string | null;
  }
) => {
  try {
    logger.info({ userId, fields: Object.keys(data) }, 'Updating profile');

    // Extract doctor profile specific fields
    const {
      clinicAddress,
      clinicStreet,
      clinicCity,
      clinicState,
      clinicZipCode,
      clinicCountry,
      specialization,
      bio,
      consultationFee,
      services,
      workingHours,
      clinicName,
      clinicLatitude,
      clinicLongitude,
      bankAccountDetails,
      upiId,
      ...userData
    } = data;

    // Update user data
    await prisma.user.update({
      where: { id: userId },
      data: userData,
    });

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        clinicId: true,
      },
    });

    // If ANY doctor specific fields are provided and user is a doctor, update the doctor profile
    if (
      currentUser?.role === 'DOCTOR' &&
      (clinicAddress !== undefined ||
        clinicStreet !== undefined ||
        clinicCity !== undefined ||
        clinicState !== undefined ||
        clinicZipCode !== undefined ||
        specialization !== undefined ||
        bio !== undefined ||
        consultationFee !== undefined ||
        services !== undefined ||
        workingHours !== undefined ||
        clinicName !== undefined ||
        clinicLatitude !== undefined ||
        clinicLongitude !== undefined ||
        bankAccountDetails !== undefined ||
        upiId !== undefined)
    ) {
      const joinedClinicAddress =
        clinicAddress !== undefined
          ? clinicAddress
          : [clinicStreet, clinicCity, clinicState, clinicZipCode]
              .filter(Boolean)
              .join(', ') || undefined;

      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId },
      });

      if (doctorProfile) {
        await prisma.doctorProfile.update({
          where: { userId },
          data: {
            ...(joinedClinicAddress !== undefined ? { clinicAddress: joinedClinicAddress } : {}),
            specialization,
            bio,
            consultationFee,
            services,
            workingHours,
            clinicName,
            clinicLatitude,
            clinicLongitude,
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
            clinicAddress: joinedClinicAddress,
            clinicLatitude,
            clinicLongitude,
            bio,
            consultationFee: consultationFee || 0,
            services: services || [],
            workingHours: workingHours,
          },
        });
      }

      // Sync structured address onto Clinic table (Clinic Information / appointments)
      if (
        currentUser.clinicId &&
        (clinicStreet !== undefined ||
          clinicCity !== undefined ||
          clinicState !== undefined ||
          clinicZipCode !== undefined ||
          clinicAddress !== undefined ||
          clinicName !== undefined ||
          clinicLatitude !== undefined ||
          clinicLongitude !== undefined)
      ) {
        const clinicUpdate: Record<string, unknown> = {};
        if (clinicName !== undefined && clinicName) clinicUpdate.name = clinicName;
        if (clinicStreet !== undefined) clinicUpdate.address = clinicStreet;
        else if (clinicAddress !== undefined && !clinicCity && !clinicState) {
          // Fallback: store full string in address when structured street not provided
          clinicUpdate.address = clinicAddress;
        }
        if (clinicCity !== undefined) clinicUpdate.city = clinicCity;
        if (clinicState !== undefined) clinicUpdate.state = clinicState;
        if (clinicZipCode !== undefined) clinicUpdate.zipCode = clinicZipCode;
        if (clinicCountry !== undefined) clinicUpdate.country = clinicCountry;
        if (clinicLatitude !== undefined) clinicUpdate.latitude = clinicLatitude;
        if (clinicLongitude !== undefined) clinicUpdate.longitude = clinicLongitude;

        if (Object.keys(clinicUpdate).length > 0) {
          try {
            await prisma.clinic.update({
              where: { id: currentUser.clinicId },
              data: clinicUpdate,
            });
          } catch (clinicErr: any) {
            logger.warn(
              { userId, clinicId: currentUser.clinicId, error: clinicErr?.message },
              'Doctor profile updated but clinic address sync failed'
            );
          }
        }
      }
    }

    // Return fresh profile including doctorProfile
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
        profileImage: true,
        clinicId: true,
        updatedAt: true,
        doctorProfile: true,
      },
    });

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
    const { page = 1, limit = 50 } = req.query || {};
    const { role, search, sortBy = 'createdAt', order = 'desc', includeDeleted } = req.query || {};

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    // Soft-deleted users are hidden unless explicitly requested
    if (String(includeDeleted) !== 'true') {
      where.deletedAt = null;
    }
    if (role) {
      where.role = (role as string).toUpperCase();
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Clinic owners only see their clinic staff; admins see everyone
    if (req.user?.role !== 'ADMIN' && req.user?.clinicId) {
      where.clinicId = req.user.clinicId;
    }

    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.firstName = order;
    } else {
      orderBy[sortBy as string] = order;
    }

    logger.info({ where, pageNum, limitNum, orderBy }, 'Fetching users with filters');

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          clinicId: true,
          createdAt: true,
          deletedAt: true,
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
  isActive: boolean,
  options?: { permanent?: boolean }
) => {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firebaseUid: true, email: true, role: true },
  });

  if (!existing) {
    throw new AppError('User not found', 404);
  }

  // Suspend: deactivate but keep recoverable (deletedAt null)
  // Delete (permanent soft-delete): deactivate + set deletedAt
  // Activate: clear deletedAt
  const permanent = options?.permanent === true;
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive,
      deletedAt: isActive ? null : permanent ? new Date() : null,
    },
    select: SAFE_USER_SELECT,
  });

  // Keep Firebase auth in sync so deactivated/deleted accounts cannot sign in
  if (existing.firebaseUid) {
    try {
      await admin.auth().updateUser(existing.firebaseUid, {
        disabled: !isActive,
      });
    } catch (error: any) {
      logger.warn(
        { userId, error: error.message },
        'Failed to sync Firebase disabled state during status update'
      );
    }
  }

  return user;
};

/**
 * Change password for the authenticated user.
 * Verifies current password via Firebase Identity Toolkit, then updates.
 * Also syncs optional DB password hash when present.
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  if (!newPassword || newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }
  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from your current password', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firebaseUid: true, password: true },
  });

  if (!user?.email) {
    throw new AppError('User not found', 404);
  }

  try {
    await changeFirebasePasswordViaRest({
      email: user.email,
      currentPassword,
      newPassword,
    });
  } catch (err: any) {
    const message = String(err?.message || '');
    if (
      message.includes('INVALID_PASSWORD') ||
      message.includes('INVALID_LOGIN_CREDENTIALS') ||
      message.includes('EMAIL_NOT_FOUND')
    ) {
      throw new AppError('Current password is incorrect', 400);
    }
    if (message.includes('WEAK_PASSWORD')) {
      throw new AppError('Password is too weak. Use at least 8 characters.', 400);
    }
    if (message.includes('TOO_MANY_ATTEMPTS')) {
      throw new AppError('Too many attempts. Please try again later.', 429);
    }
    logger.error({ userId, message }, 'Password change failed');
    throw new AppError('Failed to change password', 500);
  }

  // Best-effort: keep legacy DB password hash in sync (Firebase is source of truth)
  try {
    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
  } catch (syncErr: any) {
    logger.warn(
      { userId, error: syncErr?.message },
      'Firebase password updated but DB hash sync failed'
    );
  }
};
