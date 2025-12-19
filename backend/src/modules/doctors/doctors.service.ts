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
}) => {
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

  // Build where clause
  const where: any = {
    user: {
      role: 'DOCTOR',
      isActive: true,
      onboardingCompleted: true,
    },
    clinicLatitude: { not: null },
    clinicLongitude: { not: null },
  };

  if (specialization) {
    where.specialization = specialization;
  }

  if (clinicName) {
    where.clinicName = { contains: clinicName, mode: 'insensitive' };
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

  // Filter by location if provided
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
        return {
          ...doctor,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        };
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  // Filter by name if provided
  if (name) {
    const nameLower = name.toLowerCase();
    filteredDoctors = filteredDoctors.filter((doctor) => {
      const fullName = `${doctor.user.firstName} ${doctor.user.lastName}`.toLowerCase();
      return fullName.includes(nameLower);
    });
  }

  // Filter by city if provided
  if (city) {
    filteredDoctors = filteredDoctors.filter((doctor) => {
      // Assuming clinicAddress contains city info
      return doctor.clinicAddress?.toLowerCase().includes(city.toLowerCase());
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
  const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
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

