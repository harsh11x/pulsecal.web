import { Router } from 'express';
import {
  createEmergencyContactController,
  getEmergencyContactsController,
  getEmergencyContactByIdController,
  updateEmergencyContactController,
  deleteEmergencyContactController,
} from './emergencyContacts.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePatient } from '../../middlewares/role.middleware';

const router = Router();

router.post('/', authenticate, requirePatient, createEmergencyContactController);
router.get('/', authenticate, requirePatient, getEmergencyContactsController);
router.get('/:id', authenticate, requirePatient, getEmergencyContactByIdController);
router.put('/:id', authenticate, requirePatient, updateEmergencyContactController);
router.delete('/:id', authenticate, requirePatient, deleteEmergencyContactController);

export default router;

