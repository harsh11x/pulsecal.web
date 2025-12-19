import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase';
import prisma from '../config/database';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    isEmailVerified: boolean;
    firebaseUid: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Find or create user in database
    // First try to find by firebaseUid (most reliable)
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        firebaseUid: true,
      },
    });
    
    // If not found by firebaseUid, try by email
    if (!user && decodedToken.email) {
      user = await prisma.user.findUnique({
        where: { email: decodedToken.email },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          firebaseUid: true,
        },
      });
    }

    // If user doesn't exist, create them
    if (!user && decodedToken.email) {
      // Determine role from custom claims or default to PATIENT
      const role = (decodedToken.role as string) || 'PATIENT';
      
      user = await prisma.user.create({
        data: {
          email: decodedToken.email,
          firstName: decodedToken.name?.split(' ')[0] || 'User',
          lastName: decodedToken.name?.split(' ').slice(1).join(' ') || '',
          role: role as 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN',
          isActive: true,
          isEmailVerified: decodedToken.email_verified || false,
          firebaseUid: decodedToken.uid,
          emailVerifiedAt: decodedToken.email_verified ? new Date() : null,
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          firebaseUid: true,
        },
      });

      // Create profile based on role
      if (user.role === 'PATIENT') {
        await prisma.patientProfile.create({
          data: {
            userId: user.id,
          },
        });
      } else if (user.role === 'DOCTOR') {
        await prisma.doctorProfile.create({
          data: {
            userId: user.id,
            licenseNumber: `LIC-${user.id.substring(0, 8)}`,
            specialization: 'General',
          },
        });
      }
    } else if (user) {
      // Update existing user with Firebase UID if missing
      if (!user.firebaseUid) {
      // Update existing user with Firebase UID
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: decodedToken.uid,
          isEmailVerified: decodedToken.email_verified || user.isEmailVerified,
          emailVerifiedAt: decodedToken.email_verified ? new Date() : user.emailVerifiedAt,
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          firebaseUid: true,
        },
      });
    }

    if (!user || !user.isActive) {
      return sendError(res, 'User not found or inactive', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      firebaseUid: user.firebaseUid || decodedToken.uid,
    };

    next();
  } catch (error) {
    logger.error('Firebase authentication error:', error);
    return sendError(res, 'Invalid or expired token', 401);
  }
};

