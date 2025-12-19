import { Router } from 'express';
import {
  exportUserDataController,
  getExportHistoryController,
  deleteExportController,
} from './importExport.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePatient } from '../../middlewares/role.middleware';

const router = Router();

router.post('/export', authenticate, requirePatient, exportUserDataController);
router.get('/exports', authenticate, requirePatient, getExportHistoryController);
router.delete('/exports/:id', authenticate, requirePatient, deleteExportController);

export default router;

