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
import { requireStaff } from '../../middlewares/role.middleware';
import { upload } from '../../middlewares/upload.middleware';
import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';

const router = Router();

// Only clinic owner (head doctor) or admin can manage staff for a clinic
const ensureClinicOwnerOrAdmin = async (req: any, _res: any, next: any) => {
  try {
    const user = req.user;
    if (!user) throw new AppError('User not authenticated', 401);
    if (user.role === 'ADMIN') return next();
    if (user.role !== 'DOCTOR') throw new AppError('Only the clinic owner can manage staff', 403);
    if (!user.clinicId) return next(); // Solo doctor – treat as owner

    const clinic = await prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: { ownerId: true },
    });

    if (!clinic?.ownerId || clinic.ownerId === user.id) return next();

    // Legacy fallback: if this is the only doctor in the clinic, treat as owner
    const doctorCount = await prisma.user.count({
      where: { clinicId: user.clinicId, role: 'DOCTOR' },
    });
    if (doctorCount === 1) {
      await prisma.clinic.update({ where: { id: user.clinicId }, data: { ownerId: user.id } });
      return next();
    }

    throw new AppError('Only the clinic creator (head doctor) can manage staff', 403);
  } catch (err) {
    next(err);
  }
};

router.post('/', authenticate, requireStaff, ensureClinicOwnerOrAdmin, createUserController);
router.get('/profile', authenticate, getProfileController);
router.put('/profile', authenticate, updateProfileController);
router.post('/profile/picture', authenticate, upload.single('file'), uploadProfilePictureController);
router.get('/', authenticate, requireStaff, ensureClinicOwnerOrAdmin, getAllUsersController);
router.get('/:id', authenticate, requireStaff, ensureClinicOwnerOrAdmin, getUserByIdController);

// Allow: admin (any), self (own account), or clinic owner (staff in their clinic)
const ensureCanUpdateUserStatus = async (req: any, _res: any, next: any) => {
  try {
    const actor = req.user;
    if (!actor) throw new AppError('User not authenticated', 401);

    const targetId = req.params.id;
    if (actor.role === 'ADMIN' || actor.id === targetId) return next();

    if (actor.role !== 'DOCTOR') {
      throw new AppError('Insufficient permissions', 403);
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, clinicId: true, role: true },
    });
    if (!target) throw new AppError('User not found', 404);

    // Solo doctors without clinicId can only change their own status (handled above)
    if (!actor.clinicId || target.clinicId !== actor.clinicId) {
      throw new AppError('Insufficient permissions', 403);
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: actor.clinicId },
      select: { ownerId: true },
    });

    if (clinic?.ownerId === actor.id) return next();

    const doctorCount = await prisma.user.count({
      where: { clinicId: actor.clinicId, role: 'DOCTOR' },
    });
    if (doctorCount === 1) {
      await prisma.clinic.update({ where: { id: actor.clinicId }, data: { ownerId: actor.id } });
      return next();
    }

    throw new AppError('Only the clinic owner can deactivate staff', 403);
  } catch (err) {
    next(err);
  }
};

router.patch('/:id/status', authenticate, ensureCanUpdateUserStatus, updateUserStatusController);

export default router;

