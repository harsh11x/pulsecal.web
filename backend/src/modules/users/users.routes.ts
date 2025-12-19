import { Router } from 'express';
import {
  getProfileController,
  updateProfileController,
  getAllUsersController,
  getUserByIdController,
  updateUserStatusController,
} from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin, requireStaff } from '../../middlewares/role.middleware';

const router = Router();

router.get('/profile', authenticate, getProfileController);
router.put('/profile', authenticate, updateProfileController);
router.get('/', authenticate, requireStaff, getAllUsersController);
router.get('/:id', authenticate, requireStaff, getUserByIdController);
router.patch('/:id/status', authenticate, requireAdmin, updateUserStatusController);

export default router;

