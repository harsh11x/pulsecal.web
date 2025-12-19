import { Router } from 'express';
import {
  createMedicalRecordController,
  getMedicalRecordsController,
  getMedicalRecordByIdController,
  updateMedicalRecordController,
  deleteMedicalRecordController,
} from './medicalRecords.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireDoctor, requireStaff } from '../../middlewares/role.middleware';

const router = Router();

router.post('/', authenticate, requireDoctor, createMedicalRecordController);
router.get('/', authenticate, getMedicalRecordsController);
router.get('/:id', authenticate, getMedicalRecordByIdController);
router.put('/:id', authenticate, requireDoctor, updateMedicalRecordController);
router.delete('/:id', authenticate, requireStaff, deleteMedicalRecordController);

export default router;

