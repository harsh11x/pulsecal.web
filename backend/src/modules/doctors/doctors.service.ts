import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

/**
 * Search doctors with location-based filtering (10km radius by default)
 */
export const searchDoctors = async (params: {
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers, default 10
  specialization?: string;
  name?: string;
  clinicName?: string;
  minFee?: number;
  maxFee?: number;
  city?: string;
  page?: number;
  limit?: number;
  services?: string;
  search?: string;
  reason?: string; // symptom/disease (e.g. fever, cough) - matches specialization & services
}) => {
  let {
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
    services,
    search,
    reason, // symptom/disease/reason search (e.g. fever, cough)
  } = params;

  // Cap radius at 50km to prevent accidental global results (e.g. wrong unit)
  if (radius > 50) radius = 50;

  const skip = (page - 1) * limit;

  // Build where clause - use city (no radius/location)
  const where: any = {
    user: {
      role: 'DOCTOR',
      isActive: true,
      onboardingCompleted: true,
    },
  };

  if (specialization) {
    where.specialization = specialization;
  }

  if (clinicName) {
    where.clinicName = { contains: clinicName, mode: 'insensitive' };
  }

  // Filter by city - matches clinicAddress or linked clinic's city (all doctors in that city)
  if (city && city.trim()) {
    const cityTerm = city.trim();
    where.AND = where.AND || [];
    where.AND.push({
      OR: [
        { clinicAddress: { contains: cityTerm, mode: 'insensitive' } },
        { user: { clinic: { city: { contains: cityTerm, mode: 'insensitive' } } } },
      ],
    });
  }

  // Filter by services (if provided)
  if (services) {
     where.services = {
         has: services
     };
  }

  // Search by name, specialty, clinic (OR logic)
  const searchOrReason = search || reason;
  if (searchOrReason) {
      const term = (searchOrReason as string).toLowerCase().trim();
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { user: { OR: [{ firstName: { contains: term, mode: 'insensitive' } }, { lastName: { contains: term, mode: 'insensitive' } }] } },
          { clinicName: { contains: term, mode: 'insensitive' } },
          { specialization: { contains: term, mode: 'insensitive' } },
          { services: { has: term } },
        ],
      });
  }

  if (minFee !== undefined || maxFee !== undefined) {
    where.consultationFee = {};
    if (minFee !== undefined) {
      where.consultationFee.gte = minFee;
    }
    if (maxFee !== undefined) {
      where.consultationFee.lte = maxFee;
    }
  }

  // Get all doctors matching filters
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

  // Filter by name if provided
  if (name) {
    const nameLower = name.toLowerCase();
    filteredDoctors = filteredDoctors.filter((doctor) => {
      const fullName = `${doctor.user.firstName} ${doctor.user.lastName}`.toLowerCase();
      return fullName.includes(nameLower);
    });
  }

  // Filter by reason/symptom (matches specialization or services array)
  if (reason) {
    const reasonLower = reason.toLowerCase();
    filteredDoctors = filteredDoctors.filter((doctor) => {
      const specMatch = doctor.specialization?.toLowerCase().includes(reasonLower);
      const servicesMatch = Array.isArray(doctor.services) &&
        doctor.services.some((s: string) => s.toLowerCase().includes(reasonLower));
      return specMatch || servicesMatch;
    });
  }

  const total = filteredDoctors.length;

  return {
    doctors: filteredDoctors.slice(0, limit),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get doctor by ID with full profile
 */
export const getDoctorById = async (doctorId: string) => {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: doctorId },
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
    throw new AppError('Doctor not found', 404);
  }

  return doctor;
};

/**
 * Get doctor availability for a specific date
 */
export const getDoctorAvailability = async (doctorId: string, date: Date) => {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: doctorId },
  });

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  // Get existing appointments for the day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        notIn: ['CANCELLED', 'NO_SHOW'],
      },
    },
    select: {
      scheduledAt: true,
      duration: true,
    },
  });

  // Parse working hours
  const workingHours = doctor.workingHours as any;
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const daySchedule = workingHours?.[dayName];

  if (!daySchedule || !daySchedule.isOpen) {
    return { available: false, slots: [] };
  }

  // Generate available time slots
  const slots: string[] = [];
  const [startHour, startMin] = daySchedule.start.split(':').map(Number);
  const [endHour, endMin] = daySchedule.end.split(':').map(Number);

  const startTime = new Date(date);
  startTime.setHours(startHour, startMin, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHour, endMin, 0, 0);

  const slotDuration = 30; // 30 minutes per slot
  let currentTime = new Date(startTime);

  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);

    // Check if slot conflicts with existing appointments
    const hasConflict = appointments.some((apt) => {
      const aptStart = new Date(apt.scheduledAt);
      const aptEnd = new Date(aptStart.getTime() + (apt.duration || 30) * 60000);
      return (currentTime < aptEnd && slotEnd > aptStart);
    });

    if (!hasConflict && currentTime >= new Date()) {
      slots.push(currentTime.toISOString());
    }

    currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
  }

  return { available: true, slots };
};

/**
 * Get available slots for multiple days (for patient booking)
 */
export const getDoctorSlots = async (doctorId: string, daysParam: number = 10) => {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: doctorId },
  });

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const now = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + Math.min(daysParam, 14));

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: start, lt: end },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    select: { scheduledAt: true },
  });

  const bookedStrings = new Set(existingAppointments.map((a) => new Date(a.scheduledAt).toISOString()));
  const workingHours = (doctor.workingHours as any) || {};
  const defaultStart = 9;
  const defaultEnd = 17;
  const slotDuration = 30;
  const result: { date: string; dayName: string; slots: { time: string; available: boolean }[]; isFullyBooked: boolean }[] = [];

  for (let d = 0; d < daysParam; d++) {
    const currentDay = new Date(start);
    currentDay.setDate(start.getDate() + d);
    currentDay.setHours(0, 0, 0, 0);

    const dayName = currentDay.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = workingHours[dayName];
    const isOpen = daySchedule?.isOpen !== false;
    const [startHour, startMin] = (daySchedule?.start || `${defaultStart}:00`).split(':').map(Number);
    const [endHour, endMin] = (daySchedule?.end || `${defaultEnd}:00`).split(':').map(Number);

    const daySlots: { time: string; available: boolean }[] = [];
    let hasAvailable = false;

    if (isOpen) {
      const slotStart = new Date(currentDay);
      slotStart.setHours(startHour, startMin, 0, 0);
      const slotEnd = new Date(currentDay);
      slotEnd.setHours(endHour, endMin, 0, 0);

      let current = new Date(slotStart);
      while (current < slotEnd) {
        if (current >= now) {
          const timeString = current.toISOString();
          const isBooked = bookedStrings.has(timeString);
          if (!isBooked) hasAvailable = true;
          daySlots.push({ time: timeString, available: !isBooked });
        }
        current.setMinutes(current.getMinutes() + slotDuration);
      }
    }

    if (daySlots.length > 0) {
      result.push({
        date: currentDay.toISOString().split('T')[0],
        dayName: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
        slots: daySlots,
        isFullyBooked: !hasAvailable,
      });
    }
  }

  return result;
};

