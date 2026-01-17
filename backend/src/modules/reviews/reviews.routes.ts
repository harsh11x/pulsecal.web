import { Router } from 'express';
import {
    createReviewController,
    getReviewsController,
} from './reviews.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePatient } from '../../middlewares/role.middleware';

const router = Router();

router.post('/', authenticate, requirePatient, createReviewController);
router.get('/', authenticate, getReviewsController);

export default router;
