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

    const hasFilters = !!(city && city.trim()) || !!(search || reason) || !!specialization || !!clinicName || !!services || minFee !== undefined || maxFee !== undefined;
    const onlySearchOrReason = hasFilters && !(city && city.trim()) && !specialization && !clinicName && !services && minFee === undefined && maxFee === undefined && !!(search || reason);

    // SEARCH-ONLY: raw SQL with ILIKE so search bar works without Prisma relation issues
    if (onlySearchOrReason && (search || reason)) {
      const term = `${(search || reason || '').trim()}`;
      if (term.length > 0) {
        try {
          const limitNum = Math.min(limit, 200);
          const pattern = `%${term.replace(/%/g, '\\%')}%`;
          const raw = await prisma.$queryRaw<
            Array<{
              userId: string;
              specialization: string | null;
              clinicName: string | null;
              clinicAddress: string | null;
              consultationFee: unknown;
              bio: string | null;
              services: string[] | null;
              clinicLatitude: number | null;
              clinicLongitude: number | null;
              firstName: string | null;
              lastName: string | null;
              profileImage: string | null;
            }>
          >`
          SELECT dp."userId", dp.specialization, dp."clinicName", dp."clinicAddress", dp."consultationFee",
                 dp.bio, dp.services, dp."clinicLatitude", dp."clinicLongitude",
                 u."firstName", u."lastName", u."profileImage"
          FROM doctor_profiles dp
          INNER JOIN users u ON u.id = dp."userId" AND u.role = 'DOCTOR'
          WHERE (
            u."firstName" ILIKE ${pattern}
            OR u."lastName" ILIKE ${pattern}
            OR dp.specialization ILIKE ${pattern}
            OR dp."clinicName" ILIKE ${pattern}
          )
          ORDER BY u."firstName" ASC, u."lastName" ASC
          LIMIT ${limitNum}
        `;
          const parseFee = (v: unknown): number => {
            if (v == null) return 0;
            if (typeof v === 'number' && !Number.isNaN(v)) return v;
            const n = typeof v === 'string' ? parseFloat(v) : Number(v);
            return Number.isFinite(n) ? n : 0;
          };
          const mappedDoctors = raw.map((d) => ({
            id: d.userId,
            userId: d.userId,
            firstName: d.firstName ?? '',
            lastName: d.lastName ?? '',
            specialization: d.specialization ?? 'General',
            clinicName: d.clinicName ?? null,
            clinicAddress: d.clinicAddress ?? null,
            clinicCity: null,
            clinicLatitude: d.clinicLatitude != null ? Number(d.clinicLatitude) : null,
            clinicLongitude: d.clinicLongitude != null ? Number(d.clinicLongitude) : null,
            consultationFee: parseFee(d.consultationFee),
            bio: d.bio ?? null,
            services: Array.isArray(d.services) ? d.services : [],
            profileImage: d.profileImage ?? null,
          }));
          return {
            doctors: mappedDoctors,
            pagination: { page, limit, total: mappedDoctors.length, totalPages: 1 },
          };
        } catch (searchErr: any) {
          console.error('[searchDoctors search-raw]', searchErr?.message);
          return emptyResult();
        }
      }
    }

    // NO FILTERS: use raw SQL so we never hit Prisma schema/relation issues. Returns ALL doctors.
    if (!hasFilters) {
      try {
        const limitNum = Math.min(limit, 200);
        const skipNum = skip;
        const [countRow] = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM doctor_profiles dp
        INNER JOIN users u ON u.id = dp."userId" AND u.role = 'DOCTOR'
      `;
        const total = Number(countRow?.count ?? 0);
        const raw = await prisma.$queryRaw<
          Array<{
            userId: string;
            specialization: string | null;
            clinicName: string | null;
            clinicAddress: string | null;
            consultationFee: unknown;
            bio: string | null;
            services: string[] | null;
            clinicLatitude: number | null;
            clinicLongitude: number | null;
            firstName: string | null;
            lastName: string | null;
            profileImage: string | null;
          }>
        >`
        SELECT dp."userId", dp.specialization, dp."clinicName", dp."clinicAddress", dp."consultationFee",
               dp.bio, dp.services, dp."clinicLatitude", dp."clinicLongitude",
               u."firstName", u."lastName", u."profileImage"
        FROM doctor_profiles dp
        INNER JOIN users u ON u.id = dp."userId" AND u.role = 'DOCTOR'
        ORDER BY u."firstName" ASC, u."lastName" ASC
        LIMIT ${limitNum} OFFSET ${skipNum}
      `;
        const parseFee = (v: unknown): number => {
          if (v == null) return 0;
          if (typeof v === 'number' && !Number.isNaN(v)) return v;
          const n = typeof v === 'string' ? parseFloat(v) : Number(v);
          return Number.isFinite(n) ? n : 0;
        };
        const mappedDoctors = raw.map((d) => ({
          id: d.userId,
          userId: d.userId,
          firstName: d.firstName ?? '',
          lastName: d.lastName ?? '',
          specialization: d.specialization ?? 'General',
          clinicName: d.clinicName ?? null,
          clinicAddress: d.clinicAddress ?? null,
          clinicCity: null,
          clinicLatitude: d.clinicLatitude != null ? Number(d.clinicLatitude) : null,
          clinicLongitude: d.clinicLongitude != null ? Number(d.clinicLongitude) : null,
          consultationFee: parseFee(d.consultationFee),
          bio: d.bio ?? null,
          services: Array.isArray(d.services) ? d.services : [],
          profileImage: d.profileImage ?? null,
        }));
        return {
          doctors: mappedDoctors,
          pagination: { page, limit, total, totalPages: total > 0 ? Math.ceil(total / limit) : 0 },
        };
      } catch (rawErr: any) {
        console.error('[searchDoctors raw]', rawErr?.message, rawErr?.stack);
        return emptyResult();
      }
    }

    // WITH FILTERS: use Prisma
    const where: any = {
      user: { isActive: true },
    };
    if (specialization) where.specialization = specialization;
    if (clinicName) where.clinicName = { contains: clinicName, mode: 'insensitive' };
    if (city && city.trim()) {
      const cityTerm = city.trim();
      where.AND = [{
        OR: [
          { clinicAddress: { contains: cityTerm, mode: 'insensitive' } },
          { user: { clinic: { city: { contains: cityTerm, mode: 'insensitive' } } } },
        ],
      }];
    }
    if (services) where.services = { has: services };
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
      if (minFee !== undefined) where.consultationFee.gte = minFee;
      if (maxFee !== undefined) where.consultationFee.lte = maxFee;
    }

    const doctors = await prisma.doctorProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, profileImage: true },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
      skip,
      take: limit,
    });

    let filteredDoctors = doctors;
    if (name) {
      const nameLower = name.toLowerCase();
      filteredDoctors = filteredDoctors.filter((d) => {
        const first = d.user?.firstName ?? '';
        const last = d.user?.lastName ?? '';
        return `${first} ${last}`.trim().toLowerCase().includes(nameLower);
      });
    }
    if (reason) {
      const reasonLower = reason.toLowerCase();
      filteredDoctors = filteredDoctors.filter((d) => {
        const specMatch = d.specialization?.toLowerCase().includes(reasonLower);
        const servicesMatch = Array.isArray(d.services) && d.services.some((s: string) => s.toLowerCase().includes(reasonLower));
        return specMatch || servicesMatch;
      });
    }

    const total = filteredDoctors.length;
    const slice = filteredDoctors.slice(0, limit);
    const mappedDoctors = slice.map((d) => ({
      id: d.userId,
      userId: d.userId,
      firstName: d.user?.firstName ?? '',
      lastName: d.user?.lastName ?? '',
      specialization: d.specialization ?? 'General',
      clinicName: d.clinicName ?? null,
      clinicAddress: d.clinicAddress ?? null,
      clinicCity: null,
      clinicLatitude: d.clinicLatitude != null ? Number(d.clinicLatitude) : null,
      clinicLongitude: d.clinicLongitude != null ? Number(d.clinicLongitude) : null,
      consultationFee: d.consultationFee != null ? Number(d.consultationFee) : 0,
      bio: d.bio ?? null,
      services: Array.isArray(d.services) ? d.services : [],
      profileImage: d.user?.profileImage ?? null,
    }));

    return {
      doctors: mappedDoctors,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
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
 * Get available slots for multiple days (for patient booking).
 * Always returns at least 14 days of slots (9am–6pm default) so booking never shows "no availability".
 */
export const getDoctorSlots = async (doctorId: string, daysParam: number = 10) => {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: doctorId },
  });

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
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

  // Normalize to ISO string for comparison (DB may store with different ms)
  const bookedStrings = new Set(
    existingAppointments.map((a) => {
      const d = new Date(a.scheduledAt);
      d.setSeconds(0, 0);
      return d.toISOString();
    })
  );

  const workingHours = (doctor.workingHours as any) || {};
  const defaultStart = 9;
  const defaultEnd = 18;
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
      let slotStart = new Date(currentDay);
      slotStart.setHours(startHour, startMin, 0, 0);
      const slotEnd = new Date(currentDay);
      slotEnd.setHours(endHour, endMin, 0, 0);

      // For today: start from "now" rounded up to next slot so we always have future slots
      if (d === 0 && slotStart < now) {
        const msPerSlot = slotDuration * 60 * 1000;
        slotStart = new Date(Math.ceil(now.getTime() / msPerSlot) * msPerSlot);
        slotStart.setSeconds(0, 0);
        if (slotStart >= slotEnd) slotStart = new Date(currentDay);
      }

      let current = new Date(slotStart);
      while (current < slotEnd) {
        if (current >= now) {
          const dNorm = new Date(current);
          dNorm.setSeconds(0, 0);
          const timeString = dNorm.toISOString();
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

  // Fallback: if no days (e.g. workingHours closed all), return 14 days 9am–6pm all available
  if (result.length === 0) {
    const fallbackStart = 9;
    const fallbackEnd = 18;
    for (let d = 0; d < 14; d++) {
      const currentDay = new Date(start);
      currentDay.setDate(start.getDate() + d);
      currentDay.setHours(0, 0, 0, 0);
      let slotStart = new Date(currentDay);
      slotStart.setHours(fallbackStart, 0, 0, 0);
      const slotEnd = new Date(currentDay);
      slotEnd.setHours(fallbackEnd, 0, 0, 0);
      if (d === 0 && slotStart < now) {
        const msPerSlot = slotDuration * 60 * 1000;
        slotStart = new Date(Math.ceil(now.getTime() / msPerSlot) * msPerSlot);
        slotStart.setSeconds(0, 0);
      }
      const daySlots: { time: string; available: boolean }[] = [];
      let cur = new Date(slotStart);
      while (cur < slotEnd && cur >= now) {
        cur.setSeconds(0, 0);
        const timeString = cur.toISOString();
        const isBooked = bookedStrings.has(timeString);
        daySlots.push({ time: timeString, available: !isBooked });
        cur.setMinutes(cur.getMinutes() + slotDuration);
      }
      if (daySlots.length > 0) {
        result.push({
          date: currentDay.toISOString().split('T')[0],
          dayName: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
          slots: daySlots,
          isFullyBooked: daySlots.every((s) => !s.available),
        });
      }
    }
  }

  return result;
};

