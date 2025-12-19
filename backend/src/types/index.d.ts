export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
  isActive: boolean;
  isEmailVerified: boolean;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

