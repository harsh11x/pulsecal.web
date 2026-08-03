import { Response, NextFunction, Request } from 'express';
import {
  createClinic,
  getClinics,
  getClinicById,
  updateClinic,
  deleteClinic,
} from './clinics.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AppError } from '../../middlewares/error.middleware';
import { AuthRequest } from '../../middlewares/auth.middleware';
import Joi from 'joi';
import prisma from '../../config/database';

const clinicSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().required(),
  country: Joi.string().optional(),
  phone: Joi.string().required(),
  email: Joi.string().email().optional(),
  latitude: Joi.number().optional().allow(null),
  longitude: Joi.number().optional().allow(null),
});

export const createClinicController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = clinicSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const clinic = await createClinic(value);

    if (req.user?.id) {
      // Use raw SQL for the user link — Prisma User model includes columns (gender/address)
      // that may not exist yet on older DBs, and a normal update() fails even when only
      // clinicId/onboardingCompleted are being set.
      await prisma.$executeRaw`
        UPDATE users
        SET "clinicId" = ${clinic.id},
            "onboardingCompleted" = true,
            "updatedAt" = NOW()
        WHERE id = ${req.user.id}
      `;
      await prisma.clinic.update({
        where: { id: clinic.id },
        data: {
          ownerId: req.user.id,
          staff: { connect: { id: req.user.id } },
        },
      });
    }

    sendSuccess(res, clinic, 'Clinic created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getClinicsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getClinics(req);
    sendPaginated(
      res,
      result.clinics as Array<Record<string, unknown>>,
      result.pagination,
      'Clinics retrieved successfully'
    );
  } catch (err: any) {
    console.error('[getClinicsController]', err?.message, err?.stack);
    next(err);
  }
};

export const getClinicByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clinic = await getClinicById(req.params.id);
    sendSuccess(res, clinic, 'Clinic retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateClinicController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Create a new schema where all keys are optional for update
    const updateSchema = Joi.object({
      name: Joi.string().optional(),
      address: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      zipCode: Joi.string().optional(),
      country: Joi.string().optional(),
      country: Joi.string().optional(),
      phone: Joi.string().optional(),
      email: Joi.string().email().optional(),
      website: Joi.string().uri().optional().allow(''),
      description: Joi.string().optional().allow(''),
      latitude: Joi.number().optional().allow(null),
      longitude: Joi.number().optional().allow(null),
    }).min(1);

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Access Control: Only Admin or the Clinic Owner can update
    if (req.user?.role !== 'ADMIN') {
      const clinicToUpdate = await prisma.clinic.findUnique({
        where: { id: req.params.id },
        select: { ownerId: true }
      });

      if (!clinicToUpdate) {
        throw new AppError('Clinic not found', 404);
      }

      if (clinicToUpdate.ownerId !== req.user?.id) {
        throw new AppError('Only the clinic owner can update clinic details', 403);
      }
    }

    const clinic = await updateClinic(req.params.id, value);
    sendSuccess(res, clinic, 'Clinic updated successfully');
  } catch (err) {
    next(err);
  }
};

export const getMyClinicController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new AppError('User not authenticated', 401);
    }

    let clinic = null as Awaited<ReturnType<typeof getClinicById>> | null;

    if (req.user.clinicId) {
      try {
        clinic = await getClinicById(req.user.clinicId);
      } catch {
        clinic = null;
      }
    }

    if (!clinic) {
      const owned = await prisma.clinic.findFirst({
        where: { ownerId: req.user.id, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      if (owned) {
        if (!req.user.clinicId || req.user.clinicId !== owned.id) {
          await prisma.$executeRaw`
            UPDATE users
            SET "clinicId" = ${owned.id},
                "updatedAt" = NOW()
            WHERE id = ${req.user.id}
          `;
        }
        clinic = await getClinicById(owned.id);
      }
    }

    if (!clinic) {
      throw new AppError('No clinic found for this user', 404);
    }

    sendSuccess(res, clinic, 'Clinic retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteClinicController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deleteClinic(req.params.id);
    sendSuccess(res, result, 'Clinic deleted successfully');
  } catch (err) {
    next(err);
  }
};

