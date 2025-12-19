import { Router } from 'express';
import {
  createOrUpdateInsuranceController,
  getInsuranceController,
  deleteInsuranceController,
} from './insurance.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePatient } from '../../middlewares/role.middleware';

const router = Router();

router.post('/', authenticate, requirePatient, createOrUpdateInsuranceController);
router.get('/', authenticate, requirePatient, getInsuranceController);
router.delete('/', authenticate, requirePatient, deleteInsuranceController);

export default router;

