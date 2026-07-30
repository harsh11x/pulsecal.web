import { Response, NextFunction } from 'express';
import {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
} from './medicalRecords.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';
import prisma from '../../config/database';

const createRecordSchema = Joi.object({
  patientId: Joi.string().optional().allow('', null),
  patientDetails: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().optional().allow('', null, '').default(''),
    phone: Joi.string().required(),
    gender: Joi.string().optional().allow('', null),
    address: Joi.string().optional().allow('', null),
  }).optional(),
  doctorId: Joi.string().optional(),
  appointmentId: Joi.string().optional(),
  recordType: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().optional(),
  diagnosis: Joi.string().optional(),
  treatment: Joi.string().optional(),
  sensitiveData: Joi.string().optional(),
  fileUrl: Joi.string().optional(),
  fileName: Joi.string().optional(),
});

const updateRecordSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  diagnosis: Joi.string().optional(),
  treatment: Joi.string().optional(),
  sensitiveData: Joi.string().optional(),
  fileUrl: Joi.string().optional(),
  fileName: Joi.string().optional(),
});

export const createMedicalRecordController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = createRecordSchema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    let patientId = value.patientId;

    // Handle Manual Patient Entry (Find or Create)
    if (!patientId && value.patientDetails) {
      const { firstName, lastName, phone, gender, address } = value.patientDetails;
      const phoneStr = String(phone || '').trim();
      if (!firstName || !phoneStr) {
        throw new AppError('Patient first name and phone are required', 400);
      }

      try {
        let patient = await prisma.user.findFirst({
          where: { phone: phoneStr },
          select: { id: true },
        });

        if (!patient) {
          const bcrypt = await import('bcrypt');
          const crypto = await import('crypto');
          const patientEmail = `patient-${phoneStr.replace(/\D/g, '')}-${crypto.randomBytes(4).toString('hex')}@pulsecal.local`;
          patient = await prisma.user.create({
            data: {
              firstName: String(firstName).trim(),
              lastName: (lastName && String(lastName).trim()) || '',
              phone: phoneStr,
              email: patientEmail,
              role: 'PATIENT',
              password: await bcrypt.hash('Pulsecal@123', 10),
              isActive: true,
              ...(gender && String(gender).trim() ? { gender: String(gender).trim() } : {}),
              ...(address && String(address).trim() ? { address: String(address).trim() } : {}),
            },
            select: { id: true },
          });
          await prisma.patientProfile.create({
            data: { userId: patient.id },
          });
        }
        patientId = patient.id;
      } catch (createErr: any) {
        console.error('[createMedicalRecord] Patient find/create error:', createErr?.message);
        throw new AppError('Could not find or create patient. Please check details.', 400);
      }
    }

    if (!patientId) {
      throw new AppError('Patient is required', 400);
    }

    const record = await createMedicalRecord({
      patientId,
      doctorId: value.doctorId || req.user.id,
      appointmentId: value.appointmentId,
      recordType: value.recordType,
      title: value.title,
      description: value.description,
      diagnosis: value.diagnosis,
      treatment: value.treatment,
      sensitiveData: value.sensitiveData,
      fileUrl: value.fileUrl,
      fileName: value.fileName,
    });
    sendSuccess(res, record, 'Medical record created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getMedicalRecordsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getMedicalRecords({
      ...req,
      user: req.user,
    });
    sendPaginated(
      res,
      result.records,
      result.pagination,
      'Medical records retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getMedicalRecordByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const record = await getMedicalRecordById(
      req.params.id,
      req.user?.id,
      req.user?.role
    );
    sendSuccess(res, record, 'Medical record retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateMedicalRecordController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = updateRecordSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const record = await updateMedicalRecord(req.params.id, value);
    sendSuccess(res, record, 'Medical record updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteMedicalRecordController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deleteMedicalRecord(req.params.id);
    sendSuccess(res, result, 'Medical record deleted successfully');
  } catch (err) {
    next(err);
  }
};

