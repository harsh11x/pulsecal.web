import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { getProfileController, syncProfileController } from './auth.controller';

const router = Router();

router.get('/profile', authenticate, getProfileController);
router.post('/sync-profile', authenticate, syncProfileController);

export default router;
