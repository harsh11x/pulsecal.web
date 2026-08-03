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
  patientName: Joi.string().optional().allow('', null),
  patientDetails: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().optional().allow('', null, '').default(''),
    phone: Joi.string().optional().allow('', null),
    gender: Joi.string().optional().allow('', null),
    address: Joi.string().optional().allow('', null),
  }).optional(),
  doctorId: Joi.string().optional(),
  appointmentId: Joi.string().optional().allow('', null),
  recordType: Joi.string().default('CLINICAL_NOTE'),
  title: Joi.string().required(),
  description: Joi.string().optional().allow('', null),
  diagnosis: Joi.string().optional().allow('', null),
  treatment: Joi.string().optional().allow('', null),
  sensitiveData: Joi.string().optional().allow('', null),
  fileUrl: Joi.string().optional().allow('', null),
  fileName: Joi.string().optional().allow('', null),
  // Clinical note extras (accepted and mapped — not stripped)
  visitDate: Joi.alternatives().try(Joi.date(), Joi.string()).optional().allow('', null),
  recordDate: Joi.alternatives().try(Joi.date(), Joi.string()).optional().allow('', null),
  doctorName: Joi.string().optional().allow('', null),
  symptoms: Joi.string().optional().allow('', null),
  notes: Joi.string().optional().allow('', null),
  bloodGroup: Joi.string().optional().allow('', null),
  prescribedMedicines: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .optional(),
  medicalTests: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .optional(),
  vitalSigns: Joi.object({
    bloodPressure: Joi.string().optional().allow('', null),
    heartRate: Joi.number().optional().allow(null),
    temperature: Joi.number().optional().allow(null),
    weight: Joi.number().optional().allow(null),
    height: Joi.number().optional().allow(null),
  }).optional(),
});

const updateRecordSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional().allow('', null),
  diagnosis: Joi.string().optional().allow('', null),
  treatment: Joi.string().optional().allow('', null),
  sensitiveData: Joi.string().optional().allow('', null),
  fileUrl: Joi.string().optional().allow('', null),
  fileName: Joi.string().optional().allow('', null),
  patientName: Joi.string().optional().allow('', null),
  patientId: Joi.string().optional().allow('', null),
  recordDate: Joi.alternatives().try(Joi.date(), Joi.string()).optional().allow('', null),
  visitDate: Joi.alternatives().try(Joi.date(), Joi.string()).optional().allow('', null),
  notes: Joi.string().optional().allow('', null),
  symptoms: Joi.string().optional().allow('', null),
  vitalSigns: Joi.object({
    bloodPressure: Joi.string().optional().allow('', null),
    heartRate: Joi.number().optional().allow(null),
    temperature: Joi.number().optional().allow(null),
    weight: Joi.number().optional().allow(null),
    height: Joi.number().optional().allow(null),
  }).optional(),
  bloodGroup: Joi.string().optional().allow('', null),
  prescribedMedicines: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .optional(),
  medicalTests: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .optional(),
  doctorName: Joi.string().optional().allow('', null),
});

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const buildClinicalDescription = (value: any): string | undefined => {
  const parts: string[] = [];
  if (value.notes) parts.push(String(value.notes).trim());
  if (value.symptoms) parts.push(`Symptoms: ${String(value.symptoms).trim()}`);
  if (value.description) parts.push(String(value.description).trim());
  const joined = parts.filter(Boolean).join('\n\n');
  return joined || undefined;
};

const buildTreatment = (value: any): string | undefined => {
  const medicines = toStringList(value.prescribedMedicines);
  const tests = toStringList(value.medicalTests);
  const parts: string[] = [];
  if (value.treatment) parts.push(String(value.treatment).trim());
  if (medicines.length) parts.push(`Medicines: ${medicines.join(', ')}`);
  if (tests.length) parts.push(`Tests: ${tests.join(', ')}`);
  return parts.length ? parts.join('\n') : undefined;
};

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

    let patientId = value.patientId || null;
    let patientName =
      (value.patientName && String(value.patientName).trim()) || null;

    // Optional: link from appointment — pull patient id/name if not provided
    if (value.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: value.appointmentId },
        select: {
          id: true,
          patientId: true,
          scheduledAt: true,
          patient: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
        },
      });
      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }
      if (!patientId) patientId = appointment.patientId;
      if (!patientName && appointment.patient) {
        patientName = `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim();
      }
      if (!value.visitDate && !value.recordDate && appointment.scheduledAt) {
        value.visitDate = appointment.scheduledAt;
      }
    }

    // Optional patientDetails: prefer name-only note; only create account if phone provided
    if (!patientId && value.patientDetails) {
      const { firstName, lastName, phone } = value.patientDetails;
      const phoneStr = String(phone || '').trim();
      const fullName = `${String(firstName || '').trim()} ${String(lastName || '').trim()}`.trim();
      if (!patientName && fullName) patientName = fullName;

      if (phoneStr) {
        try {
          let patient = await prisma.user.findFirst({
            where: { phone: phoneStr },
            select: { id: true, firstName: true, lastName: true },
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
              },
              select: { id: true, firstName: true, lastName: true },
            });
            await prisma.patientProfile.create({
              data: { userId: patient.id },
            });
          }
          patientId = patient.id;
          if (!patientName) {
            patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
          }
        } catch (createErr: any) {
          console.error('[createMedicalRecord] Patient find/create error:', createErr?.message);
          // Fall through — still allow name-only note without account
        }
      }
    }

    // Resolve name from linked user if still missing
    if (patientId && !patientName) {
      const user = await prisma.user.findUnique({
        where: { id: patientId },
        select: { firstName: true, lastName: true },
      });
      if (user) {
        patientName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      }
    }

    if (!patientId && !patientName) {
      throw new AppError('Patient name is required', 400);
    }

    const medicines = toStringList(value.prescribedMedicines);
    const tests = toStringList(value.medicalTests);
    const clinicalPayload = {
      doctorName: value.doctorName || undefined,
      symptoms: value.symptoms || undefined,
      notes: value.notes || undefined,
      vitalSigns: value.vitalSigns || undefined,
      bloodGroup: value.bloodGroup || undefined,
      prescribedMedicines: medicines,
      medicalTests: tests,
    };

    const description =
      buildClinicalDescription(value) ||
      value.description ||
      undefined;
    const treatment = buildTreatment(value) || value.treatment || undefined;
    const sensitiveData =
      value.sensitiveData ||
      JSON.stringify(clinicalPayload);

    const record = await createMedicalRecord({
      patientId,
      patientName,
      doctorId: value.doctorId || req.user.id,
      appointmentId: value.appointmentId || undefined,
      recordType: value.recordType || 'CLINICAL_NOTE',
      title: value.title,
      description,
      diagnosis: value.diagnosis || undefined,
      treatment,
      sensitiveData,
      fileUrl: value.fileUrl,
      fileName: value.fileName,
      recordDate: value.recordDate || value.visitDate || new Date(),
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
    const { error, value } = updateRecordSchema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const medicines = toStringList(value.prescribedMedicines);
    const tests = toStringList(value.medicalTests);
    const hasClinicalExtras =
      value.notes !== undefined ||
      value.symptoms !== undefined ||
      value.vitalSigns !== undefined ||
      value.bloodGroup !== undefined ||
      value.prescribedMedicines !== undefined ||
      value.medicalTests !== undefined ||
      value.doctorName !== undefined;

    const clinicalPayload = {
      doctorName: value.doctorName || undefined,
      symptoms: value.symptoms || undefined,
      notes: value.notes || undefined,
      vitalSigns: value.vitalSigns || undefined,
      bloodGroup: value.bloodGroup || undefined,
      prescribedMedicines: medicines,
      medicalTests: tests,
    };

    const description =
      value.notes !== undefined || value.symptoms !== undefined || value.description !== undefined
        ? buildClinicalDescription(value) || value.description || null
        : undefined;
    const treatment =
      value.prescribedMedicines !== undefined ||
      value.medicalTests !== undefined ||
      value.treatment !== undefined
        ? buildTreatment(value) || value.treatment || null
        : undefined;

    const record = await updateMedicalRecord(req.params.id, {
      title: value.title,
      description,
      diagnosis: value.diagnosis,
      treatment,
      sensitiveData: hasClinicalExtras
        ? value.sensitiveData || JSON.stringify(clinicalPayload)
        : value.sensitiveData,
      fileUrl: value.fileUrl,
      fileName: value.fileName,
      patientName: value.patientName,
      patientId: value.patientId,
      recordDate: value.recordDate || value.visitDate,
    });
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
