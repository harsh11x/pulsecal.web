import prisma from '../../config/database';
import admin from '../../config/firebase';
import { getPaginationParams, getSortParams } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';


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
      password: data.password, // Optional if we want to force password reset
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
      onboardingCompleted: true, // Assuming staff added by doctor doesn't need onboarding flow
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
          subscriptionStatus: 'ACTIVE', // Covered by clinic plan
          subscriptionPlan: clinic.subscriptionPlan,
        };
      }
    }

    await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        licenseNumber: `LIC-${user.id.substring(0, 8)}`, // Placeholder
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
  } else if (data.role === 'PATIENT') {
    await prisma.patientProfile.create({
      data: { userId: user.id },
    });
  }
  // Receptionist profile creation if model exists (Assuming no specific profile model for receptionist yet based on previous files, but usually there isn't one or it's implicitly User)

  return user;
};

export const getProfile = async (userId: string) => {
  try {
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
        isEmailVerified: true,
        onboardingCompleted: true,
        clinicId: true,
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
  } catch (error: any) {
    // Log the actual error
    console.error('Error in getProfile:', error);
    throw error;
  }
};

export const updateProfile = async (
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: Date;
    profileImage?: string;
    clinicAddress?: string;
    specialization?: string;
    bio?: string;
    consultationFee?: number;
    services?: string[];
    workingHours?: any;
    clinicName?: string;
  }
) => {
  // Extract doctor profile specific fields
  const {
    clinicAddress,
    specialization,
    bio,
    consultationFee,
    services,
    workingHours,
    clinicName,
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
      clinicName !== undefined)
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
        },
      });
    } else {
      // Create if it doesn't exist (fallback, though it should exist)
      await prisma.doctorProfile.create({
        data: {
          userId,
          licenseNumber: `LIC-${userId.substring(0, 8)}`, // Placeholder
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

  return user;
};

export const getAllUsers = async (req: {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    role?: string;
    search?: string;
  };
}) => {
  const { page, limit, skip } = getPaginationParams(req as never);
  const { orderBy, order } = getSortParams(req as never);

  const where: any = {
    deletedAt: null,
  };

  if (req.query.role) {
    where.role = req.query.role;
  }

  if (req.query.search) {
    where.OR = [
      { firstName: { contains: req.query.search, mode: 'insensitive' } },
      { lastName: { contains: req.query.search, mode: 'insensitive' } },
      { email: { contains: req.query.search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderBy]: order },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
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
    select: {
      id: true,
      email: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return user;
};

