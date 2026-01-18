import prisma from '../../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../../middlewares/error.middleware';
import { UserRole } from '@prisma/client';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Register a new user with email and password
 */
export const registerUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole = 'PATIENT'
) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      isActive: true,
      isEmailVerified: false,
      onboardingCompleted: false,
    },
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Return user data (without password) and tokens
  const { password: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};

/**
 * Login user with email and password
 */
export const loginUser = async (email: string, password: string) => {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.password) {
    throw new AppError('Please sign in with Google', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 403);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Return user data (without password) and tokens
  const { password: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};

/**
 * Login/Register user with Google OAuth
 */
export const loginWithGoogle = async (
  googleIdToken: string,
  role: UserRole = 'PATIENT'
) => {
  try {
    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: googleIdToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new AppError('Invalid Google token', 401);
    }

    const {
      sub: googleId,
      email,
      given_name: firstName,
      family_name: lastName,
      picture: profileImage,
      email_verified: emailVerified,
    } = payload;

    if (!email) {
      throw new AppError('Email not provided by Google', 400);
    }

    // Check if user exists by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
    });

    if (user) {
      // User exists - update googleId if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            profileImage: profileImage || user.profileImage,
            isEmailVerified: emailVerified || user.isEmailVerified,
            lastLoginAt: new Date(),
          },
        });
      } else {
        // Just update last login
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AppError('Your account has been deactivated', 403);
      }
    } else {
      // New user - create account
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          firstName: firstName || 'User',
          lastName: lastName || '',
          profileImage,
          role,
          isActive: true,
          isEmailVerified: emailVerified || false,
          onboardingCompleted: false,
        },
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Return user data (without password) and tokens
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      isNewUser: !user.onboardingCompleted,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Google OAuth error:', error);
    throw new AppError('Failed to authenticate with Google', 401);
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken: string) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as TokenPayload;

    // Check if refresh token exists in database and is not revoked
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!storedToken) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    return { accessToken };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid refresh token', 401);
    }
    throw error;
  }
};

/**
 * Logout user (revoke refresh token)
 */
export const logoutUser = async (userId: string, refreshToken?: string) => {
  if (refreshToken) {
    // Revoke specific refresh token
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        token: refreshToken,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  } else {
    // Revoke all refresh tokens for user
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
};

/**
 * Get user profile by ID
 */
export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      patientProfile: true,
      doctorProfile: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: Date;
    profileImage?: string;
  }
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Generate access and refresh tokens
 */
function generateTokens(payload: TokenPayload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
}

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
};

// Keep existing Firebase-related functions for backward compatibility
export const syncUserProfile = async (
  firebaseUid: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: Date;
    profileImage?: string;
    role?: UserRole;
  }
) => {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updatedUser = await prisma.user.update({
    where: { firebaseUid },
    data,
  });

  const { password: _, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

export const getUserProfile = async (firebaseUid: string) => {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    include: {
      patientProfile: true,
      doctorProfile: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const updateUserRole = async (firebaseUid: string, role: UserRole) => {
  const user = await prisma.user.update({
    where: { firebaseUid },
    data: { role },
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
