import { Router } from 'express';
import {
  syncProfileController,
  getProfileController,
  updateRoleController,
} from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';

const router = Router();

// Profile sync endpoint (called after Firebase auth)
router.post('/sync-profile', authenticate, syncProfileController);
router.get('/profile', authenticate, getProfileController);
router.put('/role/:firebaseUid', authenticate, requireAdmin, updateRoleController);

export default router;
