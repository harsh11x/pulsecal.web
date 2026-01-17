import { Router } from 'express';
import { createDoctorProfileController, updateDoctorProfileController } from './doctor-profiles.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, createDoctorProfileController);
router.put('/', authenticate, updateDoctorProfileController);

export default router;
