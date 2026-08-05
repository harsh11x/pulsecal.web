import prisma from '../../config/database';
import { getPaginationParams, getSortParams } from '../../utils/helpers';
import { AppError } from '../../middlewares/error.middleware';
import { logger } from '../../utils/logger';

export const createClinic = async (data: {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  phone: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  maxDoctors?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}) => {
  // Determine maxDoctors based on plan
  const planLimits: Record<string, number> = {
    STARTER: 1,
    BASIC: 5,
    PROFESSIONAL: 10,
    ENTERPRISE: 9999,
  };

  const clinic = await prisma.clinic.create({
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country || 'India',
      phone: data.phone,
      email: data.email,
      latitude: data.latitude,
      longitude: data.longitude,
      subscriptionPlan: data.subscriptionPlan || 'STARTER',
      subscriptionStatus: data.subscriptionStatus || 'ACTIVE',
      maxDoctors: data.maxDoctors || planLimits[data.subscriptionPlan || 'STARTER'] || 1,
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
    },
  });

  return clinic;
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getClinics = async (req: {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    city?: string;
    state?: string;
    search?: string;
    latitude?: string;
    longitude?: string;
    radius?: string; // km, default 10
  };
}) => {
  try {
  const { page, limit, skip } = getPaginationParams(req as never);
  const { orderBy: rawOrderBy, order } = getSortParams(req as never);
  const safeOrderBy = ['createdAt', 'name', 'city', 'updatedAt'].includes(rawOrderBy) ? rawOrderBy : 'createdAt';
  const lat = req.query.latitude ? parseFloat(req.query.latitude) : undefined;
  const lng = req.query.longitude ? parseFloat(req.query.longitude) : undefined;
  let radius = req.query.radius ? parseFloat(req.query.radius) : 10;
  if (radius > 50) radius = 50;

  const hasFilters = (req.query.city && req.query.city.trim()) || req.query.state || (req.query.search && req.query.search.trim()) || (lat !== undefined && lng !== undefined);

  // NO FILTERS: raw SQL so all clinics show (bypass Prisma schema/relation issues)
  if (!hasFilters) {
    const limitNum = Math.min(limit, 100);
    const [countRow] = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM clinics WHERE "isActive" = true AND "deletedAt" IS NULL
    `;
    const total = Number(countRow?.count ?? 0);
    const raw = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      country: string | null;
      phone: string;
      email: string | null;
      latitude: unknown;
      longitude: unknown;
      ownerId: string | null;
    }>>`
      SELECT id, name, address, city, state, "zipCode", country, phone, email, latitude, longitude, "ownerId"
      FROM clinics
      WHERE "isActive" = true AND "deletedAt" IS NULL
      ORDER BY name ASC
      LIMIT ${limitNum} OFFSET ${skip}
    `;

    const clinicIds = raw.map((c) => c.id);
    const ownerIds = raw.map((c) => c.ownerId).filter(Boolean) as string[];

    const staffUsers = clinicIds.length
      ? await prisma.user.findMany({
          where: {
            clinicId: { in: clinicIds },
            role: 'DOCTOR',
            isActive: true,
            deletedAt: null,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            clinicId: true,
            doctorProfile: {
              select: {
                specialization: true,
                consultationFee: true,
                services: true,
                workingHours: true,
                clinicLatitude: true,
                clinicLongitude: true,
              },
            },
          },
        })
      : [];

    // Include owner doctors not yet linked via clinicId
    const missingOwnerIds = ownerIds.filter(
      (oid) => !staffUsers.some((s) => s.id === oid)
    );
    const ownerDoctors = missingOwnerIds.length
      ? await prisma.user.findMany({
          where: {
            id: { in: missingOwnerIds },
            role: 'DOCTOR',
            isActive: true,
            deletedAt: null,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            clinicId: true,
            doctorProfile: {
              select: {
                specialization: true,
                consultationFee: true,
                services: true,
                workingHours: true,
                clinicLatitude: true,
                clinicLongitude: true,
              },
            },
          },
        })
      : [];

    const staffByClinic = new Map<string, any[]>();
    for (const s of staffUsers) {
      if (!s.clinicId) continue;
      const list = staffByClinic.get(s.clinicId) || [];
      list.push(s);
      staffByClinic.set(s.clinicId, list);
    }
    for (const c of raw) {
      if (!c.ownerId) continue;
      const owner = ownerDoctors.find((o) => o.id === c.ownerId);
      if (!owner) continue;
      const list = staffByClinic.get(c.id) || [];
      if (!list.some((s) => s.id === owner.id)) {
        list.unshift(owner);
        staffByClinic.set(c.id, list);
      }
    }

    const mapStaff = (list: any[]) =>
      (list || []).map((s: any) => ({
        ...s,
        doctorProfile: s.doctorProfile
          ? {
              ...s.doctorProfile,
              consultationFee:
                s.doctorProfile.consultationFee != null
                  ? Number(s.doctorProfile.consultationFee)
                  : 0,
            }
          : null,
      }));

    const clinics = raw.map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      city: c.city,
      state: c.state,
      zipCode: c.zipCode,
      country: c.country ?? 'India',
      phone: c.phone,
      email: c.email ?? null,
      latitude: c.latitude != null ? Number(c.latitude) : null,
      longitude: c.longitude != null ? Number(c.longitude) : null,
      staff: mapStaff(staffByClinic.get(c.id) || []),
    }));
    return {
      clinics,
      pagination: { page, limit, total, totalPages: total > 0 ? Math.ceil(total / limit) : 0 },
    };
  }

  const where: any = {
    isActive: true,
    deletedAt: null,
  };

  if (lat !== undefined && lng !== undefined) {
    where.latitude = { not: null };
    where.longitude = { not: null };
  }

  if (req.query.city && req.query.city.trim()) {
    where.city = { contains: req.query.city.trim(), mode: 'insensitive' };
  }

  if (req.query.state) {
    where.state = req.query.state;
  }

  if (req.query.search && req.query.search.trim()) {
    where.OR = [
      { name: { contains: req.query.search.trim(), mode: 'insensitive' } },
      { address: { contains: req.query.search.trim(), mode: 'insensitive' } },
    ];
  }

  let clinics = await prisma.clinic.findMany({
    where,
    skip: lat && lng ? 0 : skip,
    take: lat && lng ? 500 : limit,
    orderBy: { [safeOrderBy]: order },
    include: {
      staff: {
        where: { role: 'DOCTOR', isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          doctorProfile: {
            select: {
              specialization: true,
              consultationFee: true,
              services: true,
              workingHours: true,
              clinicLatitude: true,
              clinicLongitude: true,
            },
          },
        },
      },
    },
  });

  if (lat !== undefined && lng !== undefined) {
    clinics = clinics.filter((c) => {
      const clat = c.latitude ? Number(c.latitude) : null;
      const clng = c.longitude ? Number(c.longitude) : null;
      if (!clat || !clng) return false;
      return calculateDistance(lat, lng, clat, clng) <= radius;
    }).map((c) => {
      const clat = c.latitude ? Number(c.latitude) : 0;
      const clng = c.longitude ? Number(c.longitude) : 0;
      const distance = calculateDistance(lat, lng, clat, clng);
      return { ...c, distance: Math.round(distance * 10) / 10 };
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  const total = clinics.length;
  const paginatedClinics = lat && lng ? clinics.slice(skip, skip + limit) : clinics;

  const serialized = paginatedClinics.map((c) => ({
    ...c,
    latitude: c.latitude != null ? Number(c.latitude) : null,
    longitude: c.longitude != null ? Number(c.longitude) : null,
    staff: (c.staff ?? []).map((s: any) => ({
      ...s,
      doctorProfile: s.doctorProfile
        ? {
            ...s.doctorProfile,
            consultationFee: s.doctorProfile.consultationFee != null ? Number(s.doctorProfile.consultationFee) : 0,
          }
        : null,
    })),
  }));

  return {
    clinics: serialized,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
  } catch (err: any) {
    console.error('[getClinics]', err?.message, err?.stack);
    return { clinics: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
};

export const getClinicById = async (clinicId: string) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      staff: {
        where: { role: 'DOCTOR', isActive: true, deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profileImage: true,
          doctorProfile: {
            select: {
              specialization: true,
              consultationFee: true,
              services: true,
              workingHours: true,
              bio: true,
            },
          },
        },
      },
    },
  });

  if (!clinic) {
    throw new AppError('Clinic not found', 404);
  }

  // Heal: include owner doctor even if user.clinicId was never linked
  let staff = [...(clinic.staff || [])];
  if (clinic.ownerId && !staff.some((s) => s.id === clinic.ownerId)) {
    const owner = await prisma.user.findFirst({
      where: {
        id: clinic.ownerId,
        role: 'DOCTOR',
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true,
        clinicId: true,
        doctorProfile: {
          select: {
            specialization: true,
            consultationFee: true,
            services: true,
            workingHours: true,
            bio: true,
          },
        },
      },
    });
    if (owner) {
      staff = [owner, ...staff];
      // Best-effort link so future staff queries work
      if (!owner.clinicId) {
        try {
          await prisma.$executeRaw`
            UPDATE users
            SET "clinicId" = ${clinic.id}, "updatedAt" = NOW()
            WHERE id = ${owner.id}
          `;
        } catch {
          /* ignore */
        }
      }
    }
  }

  return {
    ...clinic,
    latitude: clinic.latitude != null ? Number(clinic.latitude) : null,
    longitude: clinic.longitude != null ? Number(clinic.longitude) : null,
    staff: staff.map((s: any) => ({
      ...s,
      doctorProfile: s.doctorProfile
        ? {
            ...s.doctorProfile,
            consultationFee:
              s.doctorProfile.consultationFee != null
                ? Number(s.doctorProfile.consultationFee)
                : 0,
          }
        : null,
    })),
  };
};

export const updateClinic = async (
  clinicId: string,
  data: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
    latitude?: number | null;
    longitude?: number | null;
    isActive?: boolean;
  }
) => {
  // Drop empty strings for optional-ish fields so we don't wipe required columns accidentally
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (typeof value === 'string' && value.trim() === '' && key !== 'address') continue;
    cleaned[key] = typeof value === 'string' ? value.trim() : value;
  }

  const clinic = await prisma.clinic.update({
    where: { id: clinicId },
    data: cleaned,
  });

  // Keep DoctorProfile denormalized address in sync (discovery, profile, maps)
  const joinedAddress = [clinic.address, clinic.city, clinic.state, clinic.zipCode]
    .filter(Boolean)
    .join(', ');

  const doctorProfileData: Record<string, unknown> = {
    clinicName: clinic.name,
    clinicAddress: joinedAddress,
  };
  if (data.latitude !== undefined) {
    doctorProfileData.clinicLatitude =
      data.latitude == null ? null : Number(data.latitude);
  }
  if (data.longitude !== undefined) {
    doctorProfileData.clinicLongitude =
      data.longitude == null ? null : Number(data.longitude);
  }

  try {
    // Prefer updating doctors linked to this clinic; also update owner profile
    const linkedUsers = await prisma.user.findMany({
      where: {
        OR: [
          { clinicId },
          ...(clinic.ownerId ? [{ id: clinic.ownerId }] : []),
        ],
        role: 'DOCTOR',
      },
      select: { id: true },
    });
    const userIds = [...new Set(linkedUsers.map((u) => u.id))];
    if (userIds.length > 0) {
      await prisma.doctorProfile.updateMany({
        where: { userId: { in: userIds } },
        data: doctorProfileData,
      });
    }
  } catch (err: any) {
    logger.warn(
      { clinicId, error: err?.message },
      'Clinic updated but failed to sync doctor profile address'
    );
  }

  return clinic;
};

export const deleteClinic = async (clinicId: string) => {
  await prisma.clinic.update({
    where: { id: clinicId },
    data: { deletedAt: new Date(), isActive: false },
  });

  return { message: 'Clinic deleted successfully' };
};

export const setClinicActiveStatus = async (clinicId: string, isActive: boolean) => {
  const existing = await prisma.clinic.findFirst({
    where: { id: clinicId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError('Clinic not found', 404);
  }

  return prisma.clinic.update({
    where: { id: clinicId },
    data: { isActive },
  });
};

