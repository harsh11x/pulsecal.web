require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const clinics = await prisma.clinic.findMany({
    take: 8,
    where: { isActive: true, deletedAt: null },
    select: { id: true, name: true, ownerId: true },
  });
  console.log('CLINIC_COUNT', clinics.length);
  for (const c of clinics) {
    const staff = await prisma.user.findMany({
      where: { clinicId: c.id, role: 'DOCTOR' },
      select: { id: true, firstName: true, lastName: true, clinicId: true, isActive: true },
    });
    const owner = c.ownerId
      ? await prisma.user.findUnique({
          where: { id: c.ownerId },
          select: { id: true, firstName: true, role: true, clinicId: true, isActive: true },
        })
      : null;
    console.log(
      JSON.stringify({
        clinic: c.name,
        id: c.id,
        staffCount: staff.length,
        staff: staff.map((s) => `${s.firstName} ${s.lastName}`),
        owner: owner
          ? {
              name: owner.firstName,
              role: owner.role,
              clinicId: owner.clinicId,
              matches: owner.clinicId === c.id,
            }
          : null,
      })
    );
  }
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
