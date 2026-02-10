import { Router } from 'express';
import {
  getProfileController,
  updateProfileController,
  getAllUsersController,
  getUserByIdController,
  updateUserStatusController,
  createUserController,
  uploadProfilePictureController,
} from './users.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireAdmin, requireStaff } from '../../middlewares/role.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();

router.post('/', authenticate, requireStaff, createUserController); // Allow staff to create users (Role checks inside)
router.get('/profile', authenticate, getProfileController);
router.put('/profile', authenticate, updateProfileController);
router.post('/profile/picture', authenticate, upload.single('file'), uploadProfilePictureController);
router.get('/', authenticate, requireStaff, getAllUsersController);
router.get('/:id', authenticate, requireStaff, getUserByIdController);
router.patch('/:id/status', authenticate, requireAdmin, updateUserStatusController);

export default router;

