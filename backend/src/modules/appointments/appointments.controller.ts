import { Response, NextFunction } from 'express';
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  rescheduleAppointment,
  cancelAppointment,
  checkInAppointment,
  deleteAppointment,
} from './appointments.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import Joi from 'joi';
import prisma from '../../config/database';

const createAppointmentSchema = Joi.object({
  patientId: Joi.string().optional().allow('', null),
  patientDetails: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().optional().allow('', null, '').default(''),
    phone: Joi.string().required(),
    email: Joi.string().optional().allow('', null),
    dob: Joi.date().optional().allow(null),
    gender: Joi.string().optional().allow('', null),
  }).optional(),
  doctorId: Joi.string().required(),
  scheduledAt: Joi.date().required(),
  duration: Joi.number().optional(),
  reason: Joi.string().optional().allow('', null),
  notes: Joi.string().optional().allow('', null),
  paymentId: Joi.string().optional().allow('', null),
  status: Joi.string().optional().allow('', null),
  type: Joi.string().optional().allow('', null),
});

const updateAppointmentSchema = Joi.object({
  scheduledAt: Joi.date().optional(),
  duration: Joi.number().optional(),
  reason: Joi.string().optional().allow('', null),
  notes: Joi.string().optional().allow('', null),
  status: Joi.string().optional().allow('', null),
});

const rescheduleSchema = Joi.object({
  scheduledAt: Joi.date().required(),
});

const cancelSchema = Joi.object({
  cancellationReason: Joi.string().optional(),
});

export const createAppointmentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('Received appointment data:', JSON.stringify(req.body, null, 2));
    const { error, value } = createAppointmentSchema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });
    if (error) {
      console.log('Validation error:', error.details);
      throw new AppError(error.details[0].message, 400);
    }
    console.log('Validated value:', JSON.stringify(value, null, 2));

    let patientId = value.patientId;

    // Patient self-booking: use logged-in user as patient
    if (!patientId && req.user?.role === 'PATIENT') {
      patientId = req.user.id;
    }

    // Handle Manual Patient Entry (Find or Create)
    if (value.patientDetails) {
      const { firstName, lastName, phone, email, dob } = value.patientDetails;
      const emailVal = (email && String(email).trim()) ? String(email).trim() : null;
      const phoneStr = String(phone || '').trim();
      if (!firstName || !phoneStr) {
        throw new AppError('Patient first name and phone are required', 400);
      }

      try {
        const whereClause: any = { OR: [{ phone: phoneStr }] };
        if (emailVal) whereClause.OR.push({ email: emailVal });

        let patient = await prisma.user.findFirst({
          where: whereClause,
          select: { id: true },
        });

        if (!patient) {
          const bcrypt = await import('bcrypt');
          const crypto = await import('crypto');
          const patientEmail = emailVal || `patient-${phoneStr.replace(/\D/g, '')}-${crypto.randomBytes(4).toString('hex')}@pulsecal.local`;
          patient = await prisma.user.create({
            data: {
              firstName: String(firstName).trim(),
              lastName: (lastName && String(lastName).trim()) || '',
              phone: phoneStr,
              email: patientEmail,
              role: 'PATIENT',
              password: await bcrypt.hash('Pulsecal@123', 10),
              isActive: true,
              dateOfBirth: dob || undefined,
            },
            select: { id: true },
          });
          await prisma.patientProfile.create({
            data: { userId: patient.id },
          });
        }
        patientId = patient.id;
      } catch (createErr: any) {
        console.error('[createAppointment] Patient find/create error:', createErr?.message);
        throw new AppError(createErr?.message?.includes('Unique constraint') ? 'A patient with this phone or email already exists.' : 'Could not create or find patient. Please check details.', 400);
      }
    }

    // Role-based Payment Logic
    // Role-based Payment Logic
    if (req.user?.role === 'PATIENT') {
      // Payment is handled post-creation or via separate flow. 
      // Status defaults to PENDING (paymentStatus: PENDING) until paid.
    }

    // Doctor/Receptionist bookings are confirmed by default

    if (!patientId) {
      throw new AppError('Patient is required for appointment', 400);
    }

    // Pass only known fields to avoid Prisma/validation issues; ensure scheduledAt is Date
    const scheduledAt = value.scheduledAt instanceof Date
      ? value.scheduledAt
      : new Date(value.scheduledAt);
    const appointment = await createAppointment({
      patientId,
      doctorId: value.doctorId,
      scheduledAt,
      duration: value.duration,
      reason: value.reason,
      notes: value.notes,
      status: (req.user?.role === 'DOCTOR' || req.user?.role === 'RECEPTIONIST') ? 'CONFIRMED' : 'SCHEDULED',
    });

    // Notify patient, doctor, and receptionists (DB + real-time)
    const appointmentWithRelations = appointment as any;
    const patientName = appointmentWithRelations.patient
      ? `${appointmentWithRelations.patient.firstName} ${appointmentWithRelations.patient.lastName}`.trim() || 'Patient'
      : 'Patient';
    const doctorName = appointmentWithRelations.doctor
      ? `Dr. ${appointmentWithRelations.doctor.firstName} ${appointmentWithRelations.doctor.lastName}`.trim()
      : undefined;

    const { notifyAppointmentCreated } = await import('../../utils/notificationHelper');
    notifyAppointmentCreated({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId || '',
      patientName,
      doctorName,
      scheduledAt: appointment.scheduledAt,
      reason: appointment.reason || undefined,
    }).catch((err) => console.error('Failed to send appointment notifications:', err));

    sendSuccess(res, appointment, 'Appointment created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getAppointmentsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await getAppointments({
      ...req,
      user: req.user,
    });
    sendPaginated(
      res,
      result.appointments,
      result.pagination,
      'Appointments retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getAppointmentByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const appointment = await getAppointmentById(
      req.params.id,
      req.user?.id,
      req.user?.role
    );
    sendSuccess(res, appointment, 'Appointment retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateAppointmentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = updateAppointmentSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const appointment = await updateAppointment(req.params.id, value);

    if (value.status === 'COMPLETED') {
      const apt = appointment as any;
      const patientName = apt.patient ? `${apt.patient.firstName || ''} ${apt.patient.lastName || ''}`.trim() || 'Patient' : 'Patient';
      const doctorName = apt.doctor ? `Dr. ${apt.doctor.firstName || ''} ${apt.doctor.lastName || ''}`.trim() : undefined;
      const { notifyAppointmentCompleted } = await import('../../utils/notificationHelper');
      notifyAppointmentCompleted({
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId || '',
        patientName,
        doctorName,
      }).catch((err) => console.error('Failed to send completion notifications:', err));
    }

    // Emit real-time update
    const { emitAppointmentUpdate } = await import('../../utils/socketEmitter');
    emitAppointmentUpdate({
      id: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId || '',
      status: appointment.status,
      scheduledAt: appointment.scheduledAt,
    });

    sendSuccess(res, appointment, 'Appointment updated successfully');
  } catch (err) {
    next(err);
  }
};

export const rescheduleAppointmentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = rescheduleSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const appointment = await rescheduleAppointment(
      req.params.id,
      value.scheduledAt
    );

    const apt = appointment as any;
    const patientName = apt.patient ? `${apt.patient.firstName || ''} ${apt.patient.lastName || ''}`.trim() || 'Patient' : 'Patient';
    const doctorName = apt.doctor ? `Dr. ${apt.doctor.firstName || ''} ${apt.doctor.lastName || ''}`.trim() : undefined;
    const { notifyAppointmentRescheduled } = await import('../../utils/notificationHelper');
    notifyAppointmentRescheduled({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId || '',
      patientName,
      doctorName,
      scheduledAt: appointment.scheduledAt,
    }).catch((err) => console.error('Failed to send reschedule notifications:', err));

    // Emit real-time update
    const { emitAppointmentUpdate } = await import('../../utils/socketEmitter');
    emitAppointmentUpdate({
      id: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId || '',
      status: appointment.status,
      scheduledAt: appointment.scheduledAt,
    });

    sendSuccess(res, appointment, 'Appointment rescheduled successfully');
  } catch (err) {
    next(err);
  }
};

export const cancelAppointmentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = cancelSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const appointment = await cancelAppointment(
      req.params.id,
      value.cancellationReason
    );

    const apt = appointment as any;
    const patientName = apt.patient ? `${apt.patient.firstName || ''} ${apt.patient.lastName || ''}`.trim() || 'Patient' : 'Patient';
    const doctorName = apt.doctor ? `Dr. ${apt.doctor.firstName || ''} ${apt.doctor.lastName || ''}`.trim() : undefined;
    const { notifyAppointmentCancelled } = await import('../../utils/notificationHelper');
    notifyAppointmentCancelled({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId || '',
      patientName,
      doctorName,
      scheduledAt: appointment.scheduledAt,
      cancellationReason: value.cancellationReason,
    }).catch((err) => console.error('Failed to send cancellation notifications:', err));

    // Emit real-time update
    const { emitAppointmentUpdate } = await import('../../utils/socketEmitter');
    emitAppointmentUpdate({
      id: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId || '',
      status: appointment.status,
      scheduledAt: appointment.scheduledAt,
    });

    sendSuccess(res, appointment, 'Appointment cancelled successfully');
  } catch (err) {
    next(err);
  }
};

export const checkInAppointmentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const appointment = await checkInAppointment(req.params.id);
    sendSuccess(res, appointment, 'Appointment checked in successfully');
  } catch (err) {
    next(err);
  }
};

export const createPatientAppointmentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role?.toUpperCase?.() !== 'PATIENT') {
      throw new AppError('Only patients can use this endpoint', 403);
    }
    const schema = Joi.object({
      doctorId: Joi.string().required(),
      scheduledAt: Joi.alternatives().try(Joi.date(), Joi.string()).required(),
      duration: Joi.number().optional(),
      reason: Joi.string().optional().allow('', null),
      notes: Joi.string().optional().allow('', null),
      phone: Joi.string().pattern(/^\d{10}$/).required().messages({ 'string.pattern.base': 'Phone must be exactly 10 digits' }),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: true, stripUnknown: true });
    if (error) throw new AppError(error.details[0].message, 400);

    const scheduledAt = typeof value.scheduledAt === 'string' ? new Date(value.scheduledAt) : value.scheduledAt;
    if (isNaN(scheduledAt.getTime())) throw new AppError('Invalid date/time', 400);

    if (value.phone) {
      try {
        await prisma.user.update({
          where: { id: req.user!.id },
          data: { phone: value.phone },
        });
      } catch (e) {
        // Non-blocking: phone update failure should not block booking
      }
    }

    const appointment = await createAppointment({
      ...value,
      scheduledAt,
      patientId: req.user!.id,
      status: 'CONFIRMED',
    });

    const { notifyAppointmentCreated } = await import('../../utils/notificationHelper');
    const aptWithRelations = appointment as any;
    const patientName = aptWithRelations.patient
      ? `${aptWithRelations.patient.firstName} ${aptWithRelations.patient.lastName}`.trim() || 'Patient'
      : 'Patient';
    const doctorName = aptWithRelations.doctor
      ? `Dr. ${aptWithRelations.doctor.firstName} ${aptWithRelations.doctor.lastName}`.trim()
      : undefined;

    notifyAppointmentCreated({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId || '',
      patientName,
      doctorName,
      scheduledAt: appointment.scheduledAt,
      reason: appointment.reason || undefined,
    }).catch((err) => console.error('Failed to send appointment notifications:', err));

    sendSuccess(res, appointment, 'Appointment created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const deleteAppointmentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await deleteAppointment(req.params.id);
    sendSuccess(res, result, 'Appointment deleted successfully');
  } catch (err) {
    next(err);
  }
};

