import prisma from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';

/**
 * Reverse geocode lat/lng to city using Nominatim
 */
async function reverseGeocodeToCity(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'PulseCal-Healthcare/1.0' },
    });
    const data = (await res.json()) as { address?: { city?: string; town?: string; village?: string; county?: string; state?: string } };
    const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county || data?.address?.state;
    return city || null;
  } catch {
    return null;
  }
}

/**
 * Search doctors with city filtering (city from param or derived from lat/lng geolocation)
 * Returns doctors with clinicLatitude/clinicLongitude for map display
 */
export const searchDoctors = async (params: {
  latitude?: number;
  longitude?: number;
  radius?: number;
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
  reason?: string;
}) => {
  const emptyResult = () => ({
    doctors: [] as any[],
    pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
  });

  try {
  let {
    latitude,
    longitude,
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
    reason,
  } = params;

  page = Number.isFinite(page) ? page : 1;
  limit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50;
  const skip = (page - 1) * limit;

  // When city not provided but lat/lng are, reverse geocode to get city
  if ((!city || !city.trim()) && latitude != null && longitude != null) {
    const derivedCity = await reverseGeocodeToCity(latitude, longitude);
    if (derivedCity) city = derivedCity;
  }

  // Build where clause - any user with a DoctorProfile and active (no role filter so doctors show regardless of role casing)
  const where: any = {
    user: {
      isActive: true,
    },
  };

  if (specialization) {
    where.specialization = specialization;
  }

  if (clinicName) {
    where.clinicName = { contains: clinicName, mode: 'insensitive' };
  }

  // Filter by city - match clinicAddress or linked clinic's city (frontend falls back to all if empty)
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

  // Get all doctors matching filters (include clinic for lat/lng fallback)
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
          clinic: {
            select: { name: true, latitude: true, longitude: true, city: true },
          },
        },
      },
    },
    skip,
    take: limit,
  });

  let filteredDoctors = doctors;

  // Filter by name if provided (guard null user)
  if (name) {
    const nameLower = name.toLowerCase();
    filteredDoctors = filteredDoctors.filter((doctor) => {
      const first = doctor.user?.firstName ?? '';
      const last = doctor.user?.lastName ?? '';
      const fullName = `${first} ${last}`.trim().toLowerCase();
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
  const slice = filteredDoctors.slice(0, limit);

  // Transform to flat format with clinicLatitude/clinicLongitude for map (from profile or clinic)
  const mappedDoctors = slice.map((d) => {
    const clinicLat = d.clinicLatitude ?? (d.user?.clinic?.latitude ? Number(d.user.clinic.latitude) : null);
    const clinicLng = d.clinicLongitude ?? (d.user?.clinic?.longitude ? Number(d.user.clinic.longitude) : null);
    return {
      id: d.userId,
      userId: d.userId,
      firstName: d.user?.firstName ?? '',
      lastName: d.user?.lastName ?? '',
      specialization: d.specialization,
      clinicName: d.clinicName ?? d.user?.clinic?.name ?? null,
      clinicAddress: d.clinicAddress,
      clinicCity: d.user?.clinic?.city ?? null,
      clinicLatitude: clinicLat,
      clinicLongitude: clinicLng,
      consultationFee: d.consultationFee ? Number(d.consultationFee) : 0,
      bio: d.bio,
      services: d.services ?? [],
      profileImage: d.user?.profileImage,
    };
  });

  return {
    doctors: mappedDoctors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  } catch (err: any) {
    console.error('[searchDoctors]', err?.message, err?.stack);
    return emptyResult();
  }
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

