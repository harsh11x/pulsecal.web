import { Router } from 'express';
import {
  getProfileController,
  updateProfileController,
  getAllUsersController,
  getUserByIdController,
  updateUserStatusController,
  createUserController,
} from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin, requireStaff, requireDoctor } from '../../middlewares/role.middleware';

const router = Router();

router.post('/', authenticate, requireStaff, createUserController); // Allow staff to create users (Role checks inside)
router.get('/profile', authenticate, getProfileController);
router.put('/profile', authenticate, updateProfileController);
router.get('/', authenticate, requireStaff, getAllUsersController);
router.get('/:id', authenticate, requireStaff, getUserByIdController);
router.patch('/:id/status', authenticate, requireAdmin, updateUserStatusController);

export default router;

