import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import {
    createPatientProfileController,
    getPatientProfileController,
} from './patient-profiles.controller';
import { requirePatient, requireStaff } from '../../middlewares/role.middleware';

const router = Router();

// Create or update profile
router.post('/', authenticate, createPatientProfileController);

// Get own profile
router.get('/', authenticate, getPatientProfileController);

// Get specific profile (for staff/doctors)
router.get('/:id', authenticate, requireStaff, getPatientProfileController);

export default router;
