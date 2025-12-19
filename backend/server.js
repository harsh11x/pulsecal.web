/**
 * PulseCal Backend Server - Complete Self-Contained Server
 * Production-ready server for AWS deployment
 * All backend functionality consolidated in a single file
 */

require('dotenv').config();

// ============================================================================
// DEPENDENCIES
// ============================================================================
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');
const { Server: SocketIOServer } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');

// ============================================================================
// CONFIGURATION
// ============================================================================
const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  databaseUrl: process.env.DATABASE_URL,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
    : null,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  redisPassword: process.env.REDIS_PASSWORD,
};

// ============================================================================
// LOGGER
// ============================================================================
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  debug: (msg, ...args) => {
    if (config.nodeEnv === 'development') {
      console.log(`[DEBUG] ${msg}`, ...args);
    }
  },
};

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================
const prisma = new PrismaClient({
  log: config.nodeEnv === 'development' 
    ? [{ level: 'query', emit: 'event' }, { level: 'error', emit: 'stdout' }]
    : [{ level: 'error', emit: 'stdout' }],
});

const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================
if (!admin.apps.length) {
  try {
    if (config.firebaseServiceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(config.firebaseServiceAccount),
      });
    } else if (config.firebaseProjectId) {
      admin.initializeApp({
        projectId: config.firebaseProjectId,
      });
    } else {
      logger.warn('Firebase configuration not found - some features may not work');
    }
    logger.info('Firebase Admin initialized');
  } catch (error) {
    logger.error('Firebase initialization error:', error);
  }
}

// ============================================================================
// REDIS INITIALIZATION (Optional)
// ============================================================================
let redisClient = null;
try {
  redisClient = new Redis({
    host: config.redisHost,
    port: config.redisPort,
    password: config.redisPassword,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 50, 2000);
    },
  });
  redisClient.on('error', (err) => {
    logger.warn('Redis connection error (continuing without Redis):', err.message);
    redisClient = null;
  });
  logger.info('Redis connected');
} catch (error) {
  logger.warn('Redis not available (continuing without Redis):', error.message);
  redisClient = null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const getPaginationParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const getSortParams = (req) => {
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
  return { orderBy: sortBy, order: sortOrder };
};

const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};

const sendError = (res, message = 'An error occurred', statusCode = 500) => {
  res.status(statusCode).json({ success: false, message, error: message });
};

const sendPaginated = (res, data, pagination, message = 'Success') => {
  res.status(200).json({ success: true, message, data, pagination });
};

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ============================================================================
// SOCKET.IO EMITTER UTILITIES
// ============================================================================
let ioInstance = null;

const setSocketInstance = (io) => {
  ioInstance = io;
};

const emitNotification = (userId, notification) => {
  if (!ioInstance) return;
  const notificationNamespace = ioInstance.of('/notifications');
  notificationNamespace.to(`user-${userId}`).emit('notification', notification);
};

const emitAppointmentUpdate = (appointment) => {
  if (!ioInstance) return;
  const notificationNamespace = ioInstance.of('/notifications');
  notificationNamespace.to(`user-${appointment.doctorId}`).emit('appointment:update', {
    appointmentId: appointment.id,
    status: appointment.status,
    scheduledAt: appointment.scheduledAt,
  });
  notificationNamespace.to(`user-${appointment.patientId}`).emit('appointment:update', {
    appointmentId: appointment.id,
    status: appointment.status,
    scheduledAt: appointment.scheduledAt,
  });
};

const emitNewAppointment = (appointment) => {
  if (!ioInstance) return;
  const notificationNamespace = ioInstance.of('/notifications');
  notificationNamespace.to(`user-${appointment.doctorId}`).emit('appointment:new', {
    appointmentId: appointment.id,
    patientName: appointment.patientName,
    scheduledAt: appointment.scheduledAt,
    reason: appointment.reason,
  });
};

const emitPaymentUpdate = (payment) => {
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

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    let user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        firebaseUid: true,
      },
    });

    if (!user && decodedToken.email) {
      user = await prisma.user.findUnique({
        where: { email: decodedToken.email },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          firebaseUid: true,
        },
      });
    }

    if (!user && decodedToken.email) {
      const role = decodedToken.role || 'PATIENT';
      user = await prisma.user.create({
        data: {
          email: decodedToken.email,
          firstName: decodedToken.name?.split(' ')[0] || 'User',
          lastName: decodedToken.name?.split(' ').slice(1).join(' ') || '',
          role: role,
          isActive: true,
          isEmailVerified: decodedToken.email_verified || false,
          firebaseUid: decodedToken.uid,
          emailVerifiedAt: decodedToken.email_verified ? new Date() : null,
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          firebaseUid: true,
        },
      });

      if (user.role === 'PATIENT') {
        await prisma.patientProfile.create({ data: { userId: user.id } });
      } else if (user.role === 'DOCTOR') {
        await prisma.doctorProfile.create({
          data: {
            userId: user.id,
            licenseNumber: `LIC-${user.id.substring(0, 8)}`,
            specialization: 'General',
          },
        });
      }
    } else if (user && !user.firebaseUid) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: decodedToken.uid,
          isEmailVerified: decodedToken.email_verified || user.isEmailVerified,
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          firebaseUid: true,
        },
      });
    }

    if (!user || !user.isActive) {
      return sendError(res, 'User not found or inactive', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      firebaseUid: user.firebaseUid || decodedToken.uid,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return sendError(res, 'Invalid or expired token', 401);
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Insufficient permissions', 403);
    }
    next();
  };
};

const requireDoctor = requireRole('DOCTOR');
const requireReceptionist = requireRole('RECEPTIONIST');
const requireStaff = requireRole('DOCTOR', 'RECEPTIONIST', 'ADMIN');

// ============================================================================
// DOCTOR SERVICES
// ============================================================================
const searchDoctors = async (params) => {
  const {
    latitude,
    longitude,
    radius = 10,
    specialization,
    name,
    clinicName,
    minFee,
    maxFee,
    city,
    page = 1,
    limit = 50,
  } = params;

  const skip = (page - 1) * limit;

  const where = {
    user: {
      role: 'DOCTOR',
      isActive: true,
      onboardingCompleted: true,
    },
    clinicLatitude: { not: null },
    clinicLongitude: { not: null },
  };

  if (specialization) where.specialization = specialization;
  if (clinicName) where.clinicName = { contains: clinicName, mode: 'insensitive' };
  if (minFee !== undefined || maxFee !== undefined) {
    where.consultationFee = {};
    if (minFee !== undefined) where.consultationFee.gte = minFee;
    if (maxFee !== undefined) where.consultationFee.lte = maxFee;
  }

  const doctors = await prisma.doctorProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      },
    },
    skip,
    take: limit,
  });

  let filteredDoctors = doctors;
  if (latitude && longitude) {
    filteredDoctors = doctors
      .filter((doctor) => {
        if (!doctor.clinicLatitude || !doctor.clinicLongitude) return false;
        const distance = calculateDistance(
          latitude,
          longitude,
          Number(doctor.clinicLatitude),
          Number(doctor.clinicLongitude)
        );
        return distance <= radius;
      })
      .map((doctor) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          Number(doctor.clinicLatitude),
          Number(doctor.clinicLongitude)
        );
        return { ...doctor, distance: Math.round(distance * 10) / 10 };
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  if (name) {
    const nameLower = name.toLowerCase();
    filteredDoctors = filteredDoctors.filter((doctor) => {
      const fullName = `${doctor.user.firstName} ${doctor.user.lastName}`.toLowerCase();
      return fullName.includes(nameLower);
    });
  }

  if (city) {
    filteredDoctors = filteredDoctors.filter((doctor) => {
      return doctor.clinicAddress?.toLowerCase().includes(city.toLowerCase());
    });
  }

  return {
    doctors: filteredDoctors.slice(0, limit),
    pagination: {
      page,
      limit,
      total: filteredDoctors.length,
      totalPages: Math.ceil(filteredDoctors.length / limit),
    },
  };
};

const getDoctorAnalytics = async (doctorId, period = 'day') => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case '3months':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: startDate },
      deletedAt: null,
    },
    include: {
      patient: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  const completedAppointmentIds = appointments
    .filter(apt => apt.status === 'COMPLETED')
    .map(apt => apt.id);

  const payments = await prisma.payment.findMany({
    where: {
      appointmentId: { in: completedAppointmentIds },
      status: 'COMPLETED',
    },
  });

  const totalAppointments = appointments.length;
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduledAt);
    return aptDate.toDateString() === now.toDateString();
  }).length;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayAppointments = await prisma.appointment.count({
    where: {
      doctorId,
      scheduledAt: {
        gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
        lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      },
      deletedAt: null,
    },
  });

  const confirmedAppointments = appointments.filter(apt => 
    ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(apt.status)
  ).length;

  const cancelledAppointments = appointments.filter(apt => apt.status === 'CANCELLED').length;
  const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  const todayPayments = payments.filter(payment => {
    const paidDate = payment.paidAt ? new Date(payment.paidAt) : new Date(payment.createdAt);
    return paidDate.toDateString() === now.toDateString();
  });
  const todayRevenue = todayPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  const yesterdayPayments = await prisma.payment.findMany({
    where: {
      appointmentId: { in: completedAppointmentIds },
      status: 'COMPLETED',
      paidAt: {
        gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
        lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      },
    },
  });
  const yesterdayRevenue = yesterdayPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  const cancellationRate = totalAppointments > 0 
    ? (cancelledAppointments / totalAppointments) * 100 
    : 0;

  // Revenue trends (simplified - returns daily breakdown)
  const revenueTrends = [];
  const days = period === 'week' ? 7 : period === 'month' ? 30 : period === '3months' ? 90 : period === 'year' ? 365 : 1;
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayRevenue = payments
      .filter(p => {
        const paidDate = p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt);
        return paidDate >= date && paidDate < nextDate;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    revenueTrends.push({
      date: date.toISOString(),
      revenue: Number(dayRevenue.toFixed(2)),
    });
  }

  return {
    period,
    summary: {
      totalAppointments,
      todayAppointments,
      yesterdayAppointments,
      confirmedAppointments,
      cancelledAppointments,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      todayRevenue: Number(todayRevenue.toFixed(2)),
      yesterdayRevenue: Number(yesterdayRevenue.toFixed(2)),
      revenueChange: yesterdayRevenue > 0 
        ? Number((((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(2))
        : 0,
      cancellationRate: Number(cancellationRate.toFixed(2)),
      totalPatients: new Set(appointments.map(apt => apt.patientId)).size,
    },
    trends: {
      revenue: revenueTrends,
    },
  };
};

// ============================================================================
// APPOINTMENT SERVICES
// ============================================================================
const createAppointment = async (data) => {
  const appointment = await prisma.appointment.create({
    data: {
      patientId: data.patientId,
      doctorId: data.doctorId,
      scheduledAt: data.scheduledAt,
      duration: data.duration || 30,
      reason: data.reason,
      status: 'SCHEDULED',
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  emitNewAppointment({
    id: appointment.id,
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
    scheduledAt: appointment.scheduledAt,
    reason: appointment.reason || undefined,
  });

  return appointment;
};

const updateAppointment = async (appointmentId, data) => {
  const appointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  emitAppointmentUpdate({
    id: appointment.id,
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    status: appointment.status,
    scheduledAt: appointment.scheduledAt,
  });

  return appointment;
};

// ============================================================================
// PAYMENT SERVICES
// ============================================================================
const updatePaymentStatus = async (paymentId, status, transactionId) => {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: status,
      transactionId,
      paidAt: status === 'COMPLETED' ? new Date() : undefined,
    },
    include: {
      appointment: {
        select: {
          id: true,
          doctorId: true,
        },
      },
    },
  });

  if (payment.appointmentId && payment.appointment?.doctorId) {
    emitPaymentUpdate({
      id: payment.id,
      appointmentId: payment.appointmentId,
      doctorId: payment.appointment.doctorId,
      amount: Number(payment.amount),
      status: payment.status,
    });
  }

  return payment;
};

// ============================================================================
// RECEPTIONIST SERVICES
// ============================================================================
const getReceptionistStats = async (receptionistId) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const todayAppointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      deletedAt: null,
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
  });

  return {
    stats: {
      totalBooked: todayAppointments.length,
      completed: todayAppointments.filter(apt => apt.status === 'COMPLETED').length,
      waiting: todayAppointments.filter(apt => 
        ['SCHEDULED', 'CONFIRMED'].includes(apt.status)
      ).length,
      inProgress: todayAppointments.filter(apt => apt.status === 'IN_PROGRESS').length,
      cancelled: todayAppointments.filter(apt => apt.status === 'CANCELLED').length,
      noShow: todayAppointments.filter(apt => apt.status === 'NO_SHOW').length,
    },
    appointments: todayAppointments,
  };
};

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================
const app = express();

app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// ROUTES
// ============================================================================
const apiPrefix = `/api/${config.apiVersion}`;

// Doctor routes
app.get(`${apiPrefix}/doctors/search`, authenticate, async (req, res, next) => {
  try {
    const result = await searchDoctors({
      latitude: req.query.latitude ? parseFloat(req.query.latitude) : undefined,
      longitude: req.query.longitude ? parseFloat(req.query.longitude) : undefined,
      radius: req.query.radius ? parseFloat(req.query.radius) : undefined,
      specialization: req.query.specialization,
      name: req.query.name,
      clinicName: req.query.clinicName,
      minFee: req.query.minFee ? parseFloat(req.query.minFee) : undefined,
      maxFee: req.query.maxFee ? parseFloat(req.query.maxFee) : undefined,
      city: req.query.city,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    });
    sendSuccess(res, result, 'Doctors retrieved successfully');
  } catch (err) {
    next(err);
  }
});

app.get(`${apiPrefix}/doctors/analytics`, authenticate, requireDoctor, async (req, res, next) => {
  try {
    const period = ['day', 'week', 'month', '3months', 'year'].includes(req.query.period)
      ? req.query.period
      : 'day';
    const analytics = await getDoctorAnalytics(req.user.id, period);
    sendSuccess(res, analytics, 'Analytics retrieved successfully');
  } catch (err) {
    next(err);
  }
});

app.get(`${apiPrefix}/doctors/:id`, authenticate, async (req, res, next) => {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
      },
    });
    if (!doctor) {
      return sendError(res, 'Doctor not found', 404);
    }
    sendSuccess(res, doctor, 'Doctor retrieved successfully');
  } catch (err) {
    next(err);
  }
});

// Appointment routes
app.post(`${apiPrefix}/appointments`, authenticate, async (req, res, next) => {
  try {
    const { patientId, doctorId, scheduledAt, duration, reason } = req.body;
    if (!patientId || !doctorId || !scheduledAt) {
      return sendError(res, 'Missing required fields', 400);
    }
    const appointment = await createAppointment({
      patientId,
      doctorId,
      scheduledAt: new Date(scheduledAt),
      duration,
      reason,
    });
    sendSuccess(res, appointment, 'Appointment created successfully', 201);
  } catch (err) {
    next(err);
  }
});

app.get(`${apiPrefix}/appointments`, authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { orderBy, order } = getSortParams(req);

    const where = { deletedAt: null };
    if (req.user.role === 'PATIENT') {
      where.patientId = req.user.id;
    } else if (req.user.role === 'DOCTOR') {
      where.doctorId = req.user.id;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: order },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    sendPaginated(res, appointments, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, 'Appointments retrieved successfully');
  } catch (err) {
    next(err);
  }
});

app.put(`${apiPrefix}/appointments/:id`, authenticate, async (req, res, next) => {
  try {
    const appointment = await updateAppointment(req.params.id, req.body);
    sendSuccess(res, appointment, 'Appointment updated successfully');
  } catch (err) {
    next(err);
  }
});

// Payment routes
app.put(`${apiPrefix}/payments/:id/status`, authenticate, async (req, res, next) => {
  try {
    const { status, transactionId } = req.body;
    if (!status) {
      return sendError(res, 'Status is required', 400);
    }
    const payment = await updatePaymentStatus(req.params.id, status, transactionId);
    sendSuccess(res, payment, 'Payment status updated successfully');
  } catch (err) {
    next(err);
  }
});

// Receptionist routes
app.get(`${apiPrefix}/receptionists/stats`, authenticate, requireReceptionist, async (req, res, next) => {
  try {
    const stats = await getReceptionistStats(req.user.id);
    sendSuccess(res, stats, 'Stats retrieved successfully');
  } catch (err) {
    next(err);
  }
});

// Auth routes
app.get(`${apiPrefix}/auth/profile`, authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        role: true,
        isEmailVerified: true,
        profileImage: true,
        onboardingCompleted: true,
        createdAt: true,
        patientProfile: true,
        doctorProfile: true,
      },
    });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    sendSuccess(res, user, 'Profile retrieved successfully');
  } catch (err) {
    next(err);
  }
});

// Error handlers
app.use((req, res) => {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
});

app.use((err, req, res, next) => {
  logger.error('Error:', err);
  const statusCode = err.statusCode || 500;
  const message = config.nodeEnv === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message;
  sendError(res, message, statusCode);
});

// ============================================================================
// SOCKET.IO SETUP
// ============================================================================
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Redis adapter (if available)
if (redisClient) {
  try {
    const pubClient = redisClient;
    const subClient = redisClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter enabled');
  } catch (error) {
    logger.warn('Socket.IO Redis adapter not available:', error.message);
  }
}

// Socket authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                 socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const user = await prisma.user.findFirst({
      where: { firebaseUid: decodedToken.uid },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        firebaseUid: true,
      },
    });

    if (!user || !user.isActive) {
      return next(new Error('Authentication error: Invalid user'));
    }

    socket.data.user = user;
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
});

// Notification namespace
const notificationNamespace = io.of('/notifications');
notificationNamespace.on('connection', (socket) => {
  logger.info(`Notification socket connected: ${socket.id} (User: ${socket.data.user?.email})`);

  if (socket.data.user?.id) {
    socket.join(`user-${socket.data.user.id}`);
    socket.emit('subscribed', { userId: socket.data.user.id });
    logger.info(`User ${socket.data.user.id} subscribed to notifications`);
  }

  socket.on('subscribe', (data) => {
    const userId = data?.userId || socket.data.user?.id;
    if (userId) {
      socket.join(`user-${userId}`);
      socket.emit('subscribed', { userId });
    }
  });

  socket.on('unsubscribe', (data) => {
    const userId = data?.userId || socket.data.user?.id;
    if (userId) {
      socket.leave(`user-${userId}`);
      socket.emit('unsubscribed', { userId });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Notification socket disconnected: ${socket.id}`);
  });
});

setSocketInstance(io);

// ============================================================================
// SERVER STARTUP
// ============================================================================
const startServer = async () => {
  try {
    await connectDatabase();
    
    server.listen(config.port, () => {
      logger.info(`🚀 PulseCal Backend Server running on port ${config.port}`);
      logger.info(`📡 Environment: ${config.nodeEnv}`);
      logger.info(`🌐 CORS Origin: ${config.corsOrigin}`);
      logger.info(`🔌 Socket.IO enabled on /notifications`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const shutdown = async () => {
  logger.info('Shutting down server...');
  server.close(async () => {
    await prisma.$disconnect();
    if (redisClient) {
      redisClient.quit();
    }
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer();
