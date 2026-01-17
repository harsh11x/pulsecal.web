import { Request } from 'express';

declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            role: string;
            isActive: boolean;
            isEmailVerified: boolean;
            firebaseUid: string;
            clinicId?: string | null;
        }

        interface Request {
            id?: string;
        }
    }
}
