import { Router } from 'express';
import { createDoctorProfileController, updateDoctorProfileController, getDoctorProfileMeController } from './doctor-profiles.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, createDoctorProfileController);
router.get('/me', authenticate, getDoctorProfileMeController);
router.put('/me', authenticate, updateDoctorProfileController);
router.put('/', authenticate, updateDoctorProfileController);

export default router;
