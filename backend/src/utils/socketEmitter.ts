import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export const setSocketInstance = (io: SocketIOServer): void => {
  ioInstance = io;
};

export const getSocketInstance = (): SocketIOServer | null => {
  return ioInstance;
};

/**
 * Emit real-time notification to a user
 */
export const emitNotification = (
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: unknown;
  }
): void => {
  if (!ioInstance) return;

  const notificationNamespace = ioInstance.of('/notifications');
  notificationNamespace.to(`user-${userId}`).emit('notification', notification);
};

/**
 * Emit appointment update to doctor and patient
 */
export const emitAppointmentUpdate = (
  appointment: {
    id: string;
    doctorId: string;
    patientId: string;
    status: string;
    scheduledAt: Date;
  }
): void => {
  if (!ioInstance) return;

  const notificationNamespace = ioInstance.of('/notifications');
  
  // Notify doctor
  notificationNamespace.to(`user-${appointment.doctorId}`).emit('appointment:update', {
    appointmentId: appointment.id,
    status: appointment.status,
    scheduledAt: appointment.scheduledAt,
  });

  // Notify patient
  notificationNamespace.to(`user-${appointment.patientId}`).emit('appointment:update', {
    appointmentId: appointment.id,
    status: appointment.status,
    scheduledAt: appointment.scheduledAt,
  });
};

/**
 * Emit new appointment to doctor
 */
export const emitNewAppointment = (
  appointment: {
    id: string;
    doctorId: string;
    patientId: string;
    patientName: string;
    scheduledAt: Date;
    reason?: string;
  }
): void => {
  if (!ioInstance) return;

  const notificationNamespace = ioInstance.of('/notifications');
  
  notificationNamespace.to(`user-${appointment.doctorId}`).emit('appointment:new', {
    appointmentId: appointment.id,
    patientName: appointment.patientName,
    scheduledAt: appointment.scheduledAt,
    reason: appointment.reason,
  });
};

/**
 * Emit payment update to doctor
 */
export const emitPaymentUpdate = (
  payment: {
    id: string;
    appointmentId?: string;
    doctorId?: string;
    amount: number;
    status: string;
  }
): void => {
  if (!ioInstance) return;

  const notificationNamespace = ioInstance.of('/notifications');
  
  if (payment.doctorId) {
    notificationNamespace.to(`user-${payment.doctorId}`).emit('payment:update', {
      paymentId: payment.id,
      appointmentId: payment.appointmentId,
      amount: payment.amount,
      status: payment.status,
    });
  }
};

/**
 * Emit new doctor registration (for nearby patients)
 */
export const emitNewDoctor = (
  doctor: {
    id: string;
    clinicLatitude?: number | null;
    clinicLongitude?: number | null;
    city?: string;
  }
): void => {
  if (!ioInstance) return;

  const notificationNamespace = ioInstance.of('/notifications');
  
  // Broadcast to all users in the same city/area
  // In production, you'd use Redis pub/sub for this
  notificationNamespace.emit('doctor:new', {
    doctorId: doctor.id,
    city: doctor.city,
  });
};

