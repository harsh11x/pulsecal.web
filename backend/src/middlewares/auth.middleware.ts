import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../modules/auth/auth.service';
import { AppError } from './error.middleware';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        firebaseUid: string; // Required for backward compatibility
        clinicId?: string | null; // For clinic-based features
        isActive: boolean;
        isEmailVerified: boolean;
    };
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 */
export const authenticate = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided', 401);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix


        // Verify token
        const decoded = verifyToken(token);

        // Fetch user from database to get full user data
        const prisma = (await import('../config/database')).default;
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                firebaseUid: true,
                clinicId: true,
                isActive: true,
                isEmailVerified: true,
            },
        });

        if (!user || !user.isActive) {
            throw new AppError('User not found or inactive', 401);
        }

        // Attach user info to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            firebaseUid: user.firebaseUid || user.id,
            clinicId: user.clinicId,
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified,
        };

        next();
    } catch (error) {
        if (error instanceof AppError) {
            next(error);
        } else {
            next(new AppError('Invalid or expired token', 401));
        }
    }
};
