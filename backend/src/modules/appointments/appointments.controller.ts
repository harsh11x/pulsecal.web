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

const createAppointmentSchema = Joi.object({
  patientId: Joi.string().required(),
  doctorId: Joi.string().required(),
  scheduledAt: Joi.date().required(),
  duration: Joi.number().optional(),
  reason: Joi.string().optional(),
});

const updateAppointmentSchema = Joi.object({
  scheduledAt: Joi.date().optional(),
  duration: Joi.number().optional(),
  reason: Joi.string().optional(),
  notes: Joi.string().optional(),
  status: Joi.string().optional(),
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
    const { error, value } = createAppointmentSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }
    const appointment = await createAppointment(value);
    
    // Emit real-time notification
    const { emitNewAppointment } = await import('../../utils/socketEmitter');
    emitNewAppointment({
      id: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      scheduledAt: appointment.scheduledAt,
      reason: appointment.reason || undefined,
    });
    
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
    
    // Emit real-time update
    const { emitAppointmentUpdate } = await import('../../utils/socketEmitter');
    emitAppointmentUpdate({
      id: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
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

