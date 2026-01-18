import { Router } from 'express';
import {
  registerController,
  loginController,
  googleAuthController,
  refreshTokenController,
  logoutController,
  getProfileController,
  updateProfileController,
  syncProfileController,
  getFirebaseProfileController,
  updateRoleController,
} from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';

const router = Router();

// Custom auth endpoints (JWT-based)
router.post('/register', registerController);
router.post('/login', loginController);
router.post('/google', googleAuthController);
router.post('/refresh', refreshTokenController);
router.post('/logout', authenticate, logoutController);
router.get('/profile', authenticate, getProfileController);
router.put('/profile', authenticate, updateProfileController);

// Firebase compatibility endpoints (for backward compatibility)
router.post('/sync-profile', authenticate, syncProfileController);
router.get('/firebase/profile', authenticate, getFirebaseProfileController);
router.put('/role/:firebaseUid', authenticate, requireAdmin, updateRoleController);

export default router;
