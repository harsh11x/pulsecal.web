import prisma from '../config/database';
import { emitNotification, emitNewAppointment } from './socketEmitter';

/**
 * Notify relevant parties when an appointment is created.
 * Creates DB notifications and emits real-time socket events to:
 * - Patient
 * - Doctor
 * - Receptionists of the doctor's clinic (if any)
 */
export const notifyAppointmentCreated = async (params: {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  doctorName?: string;
  scheduledAt: Date;
  reason?: string;
}): Promise<void> => {
  const { appointmentId, doctorId, patientId, patientName, doctorName, scheduledAt, reason } = params;
  const scheduledStr = scheduledAt instanceof Date ? scheduledAt.toLocaleString() : String(scheduledAt);

  const metadata = {
    appointmentId,
    type: 'NEW_APPOINTMENT',
    scheduledAt: scheduledAt instanceof Date ? scheduledAt.toISOString() : scheduledAt,
  };

  // Notify patient
  const patientTitle = 'Appointment Booked';
  const patientMessage = doctorName
    ? `Your appointment with Dr. ${doctorName} is scheduled for ${scheduledStr}${reason ? `. Reason: ${reason}` : ''}`
    : `Your appointment is scheduled for ${scheduledStr}${reason ? `. Reason: ${reason}` : ''}`;

  await prisma.notification.create({
    data: {
      userId: patientId,
      type: 'NEW_APPOINTMENT',
      title: patientTitle,
      message: patientMessage,
      metadata: metadata as object,
    },
  });
  emitNotification(patientId, {
    type: 'NEW_APPOINTMENT',
    title: patientTitle,
    message: patientMessage,
    data: { appointmentId, scheduledAt, doctorName, reason },
  });

  // Notify doctor
  const doctorTitle = 'New Appointment';
  const doctorMessage = `New appointment with ${patientName} on ${scheduledStr}${reason ? `. Reason: ${reason}` : ''}`;

  await prisma.notification.create({
    data: {
      userId: doctorId,
      type: 'NEW_APPOINTMENT',
      title: doctorTitle,
      message: doctorMessage,
      metadata: metadata as object,
    },
  });
  emitNotification(doctorId, {
    type: 'NEW_APPOINTMENT',
    title: doctorTitle,
    message: doctorMessage,
    data: { appointmentId, patientName, scheduledAt, reason },
  });

  // Legacy: emit appointment:new for doctor dashboard (backward compat)
  emitNewAppointment({
    id: appointmentId,
    doctorId,
    patientId,
    patientName,
    scheduledAt,
    reason,
  });

  // Notify receptionists of the doctor's clinic
  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    select: { clinicId: true },
  });

  if (doctor?.clinicId) {
    const receptionists = await prisma.user.findMany({
      where: {
        clinicId: doctor.clinicId,
        role: 'RECEPTIONIST',
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    const recTitle = 'New Appointment';
    const recMessage = `New appointment: ${patientName} with doctor on ${scheduledStr}`;

    for (const rec of receptionists) {
      await prisma.notification.create({
        data: {
          userId: rec.id,
          type: 'NEW_APPOINTMENT',
          title: recTitle,
          message: recMessage,
          metadata: metadata as object,
        },
      });
      emitNotification(rec.id, {
        type: 'NEW_APPOINTMENT',
        title: recTitle,
        message: recMessage,
        data: { appointmentId, patientName, doctorId, scheduledAt, reason },
      });
    }
  }
};

/**
 * Notify when appointment is cancelled
 */
export const notifyAppointmentCancelled = async (params: {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  doctorName?: string;
  scheduledAt: Date;
  cancellationReason?: string;
}): Promise<void> => {
  const { appointmentId, doctorId, patientId, patientName, doctorName, scheduledAt, cancellationReason } = params;
  const scheduledStr = scheduledAt instanceof Date ? scheduledAt.toLocaleString() : String(scheduledAt);
  const reasonStr = cancellationReason ? ` Reason: ${cancellationReason}` : '';

  const patientTitle = 'Appointment Cancelled';
  const patientMessage = doctorName
    ? `Your appointment with Dr. ${doctorName} scheduled for ${scheduledStr} has been cancelled.${reasonStr}`
    : `Your appointment scheduled for ${scheduledStr} has been cancelled.${reasonStr}`;

  await prisma.notification.create({
    data: {
      userId: patientId,
      type: 'CANCELLATION',
      title: patientTitle,
      message: patientMessage,
      metadata: { appointmentId, type: 'CANCELLATION' } as object,
    },
  });
  emitNotification(patientId, { type: 'CANCELLATION', title: patientTitle, message: patientMessage });

  const doctorTitle = 'Appointment Cancelled';
  const doctorMessage = `Appointment with ${patientName} on ${scheduledStr} was cancelled.${reasonStr}`;
  await prisma.notification.create({
    data: {
      userId: doctorId,
      type: 'CANCELLATION',
      title: doctorTitle,
      message: doctorMessage,
      metadata: { appointmentId, type: 'CANCELLATION' } as object,
    },
  });
  emitNotification(doctorId, { type: 'CANCELLATION', title: doctorTitle, message: doctorMessage });
};

/**
 * Notify when appointment is completed
 */
export const notifyAppointmentCompleted = async (params: {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  doctorName?: string;
}): Promise<void> => {
  const { appointmentId, doctorId, patientId, patientName, doctorName } = params;

  const patientTitle = 'Visit Completed';
  const patientMessage = doctorName
    ? `Your visit with Dr. ${doctorName} has been completed.`
    : 'Your visit has been completed.';

  await prisma.notification.create({
    data: {
      userId: patientId,
      type: 'COMPLETED_VISIT',
      title: patientTitle,
      message: patientMessage,
      metadata: { appointmentId, type: 'COMPLETED_VISIT' } as object,
    },
  });
  emitNotification(patientId, { type: 'COMPLETED_VISIT', title: patientTitle, message: patientMessage });

  const doctorTitle = 'Appointment Completed';
  const doctorMessage = `Visit with ${patientName} has been marked as completed.`;
  await prisma.notification.create({
    data: {
      userId: doctorId,
      type: 'COMPLETED_VISIT',
      title: doctorTitle,
      message: doctorMessage,
      metadata: { appointmentId, type: 'COMPLETED_VISIT' } as object,
    },
  });
  emitNotification(doctorId, { type: 'COMPLETED_VISIT', title: doctorTitle, message: doctorMessage });
};

/**
 * Notify doctor when payment is received
 */
export const notifyPaymentReceived = async (params: {
  doctorId: string;
  patientName: string;
  amount: number;
  appointmentId?: string;
}): Promise<void> => {
  const { doctorId, patientName, amount, appointmentId } = params;
  const title = 'Payment Received';
  const message = `Payment of ₹${amount} received from ${patientName}.`;

  await prisma.notification.create({
    data: {
      userId: doctorId,
      type: 'PAYMENT_RECEIVED',
      title,
      message,
      metadata: { appointmentId, amount, type: 'PAYMENT_RECEIVED' } as object,
    },
  });
  emitNotification(doctorId, { type: 'PAYMENT_RECEIVED', title, message });
};
