import { Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  refreshAccessToken,
  logoutUser,
  getUserById,
  updateUserProfile,
  syncUserProfile,
  getUserProfile,
  updateUserRole,
} from './auth.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('PATIENT', 'DOCTOR', 'RECEPTIONIST').optional().default('PATIENT'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phone: Joi.string().optional(),
  dateOfBirth: Joi.date().optional(),
  profileImage: Joi.string().optional(),
});

const syncProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phone: Joi.string().optional(),
  dateOfBirth: Joi.date().optional(),
  profileImage: Joi.string().optional(),
  role: Joi.string().valid('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN').optional(),
});

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN').required(),
});

/**
 * Register a new user
 */
export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { email, password, firstName, lastName, role } = value;
    const result = await registerUser(email, password, firstName, lastName, role);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      'User registered successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Login user
 */
export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { email, password } = value;
    const result = await loginUser(email, password);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

/**
 * Google OAuth login/register
 */
export const googleAuthController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { googleIdToken, role } = req.body;

    if (!googleIdToken) {
      throw new AppError('Google ID token is required', 400);
    }

    const result = await loginWithGoogle(googleIdToken, role || 'PATIENT');

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
      isNewUser: result.isNewUser,
    }, result.isNewUser ? 'Account created with Google' : 'Login successful');
  } catch (err) {
    next(err);
  }
};

/**
 * Refresh access token
 */
export const refreshTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token not provided', 401);
    }

    const result = await refreshAccessToken(refreshToken);
    sendSuccess(res, result, 'Token refreshed successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Logout user
 */
export const logoutController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    await logoutUser(req.user.id, refreshToken);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    sendSuccess(res, null, 'Logout successful');
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user profile
 */
export const getProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const profile = await getUserById(req.user.id);
    sendSuccess(res, profile, 'Profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Update user profile
 */
export const updateProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const profile = await updateUserProfile(req.user.id, value);
    sendSuccess(res, profile, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

// Firebase compatibility endpoints
export const syncProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = syncProfileSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user || !req.user.firebaseUid) {
      throw new AppError('User not authenticated', 401);
    }
    const profile = await syncUserProfile(req.user.firebaseUid, value);
    sendSuccess(res, profile, 'Profile synced successfully');
  } catch (err) {
    next(err);
  }
};

export const getFirebaseProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.firebaseUid) {
      throw new AppError('User not authenticated', 401);
    }
    const profile = await getUserProfile(req.user.firebaseUid);
    sendSuccess(res, profile, 'Profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateRoleController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = updateRoleSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user || !req.user.firebaseUid) {
      throw new AppError('User not authenticated', 401);
    }
    const firebaseUid = req.params.firebaseUid || req.user.firebaseUid;
    const user = await updateUserRole(firebaseUid, value.role);
    sendSuccess(res, user, 'User role updated successfully');
  } catch (err) {
    next(err);
  }
};
