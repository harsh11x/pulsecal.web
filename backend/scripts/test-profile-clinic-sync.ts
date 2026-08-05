import prisma from '../src/config/database';
import { updateProfile } from '../src/modules/users/users.service';

async function main() {
  const doctor = await prisma.user.findFirst({
    where: { role: 'DOCTOR', clinicId: { not: null }, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      clinicId: true,
      doctorProfile: { select: { clinicAddress: true } },
    },
  });

  if (!doctor?.clinicId) {
    console.log('NO_DOCTOR');
    return;
  }

  const clinicBefore = await prisma.clinic.findUnique({ where: { id: doctor.clinicId } });
  console.log('BEFORE', JSON.stringify({
    userId: doctor.id,
    clinicId: doctor.clinicId,
    address: clinicBefore?.address,
    city: clinicBefore?.city,
    dp: doctor.doctorProfile?.clinicAddress,
  }));

  const marker = `PulseCal Test Lane ${Date.now()}`;
  const city = clinicBefore?.city || 'Mumbai';
  const state = clinicBefore?.state || 'Maharashtra';
  const zip = clinicBefore?.zipCode || '400001';

  const result = await updateProfile(doctor.id, {
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    phone: doctor.phone || undefined,
    clinicStreet: marker,
    clinicCity: city,
    clinicState: state,
    clinicZipCode: zip,
    clinicCountry: 'India',
    clinicAddress: [marker, city, state, zip].join(', '),
  });

  const clinicAfter = await prisma.clinic.findUnique({ where: { id: doctor.clinicId } });
  const dpAfter = await prisma.doctorProfile.findUnique({
    where: { userId: doctor.id },
    select: { clinicAddress: true },
  });

  console.log('AFTER', JSON.stringify({
    clinicAddress: clinicAfter?.address,
    clinicCity: clinicAfter?.city,
    dp: dpAfter?.clinicAddress,
    profileFirstName: result?.firstName,
  }));

  const ok =
    clinicAfter?.address === marker &&
    String(dpAfter?.clinicAddress || '').includes(marker);
  console.log('TEST_RESULT', ok ? 'PASS' : 'FAIL');

  if (clinicBefore) {
    await prisma.clinic.update({
      where: { id: doctor.clinicId },
      data: {
        address: clinicBefore.address,
        city: clinicBefore.city,
        state: clinicBefore.state,
        zipCode: clinicBefore.zipCode,
        country: clinicBefore.country,
      },
    });
    await prisma.doctorProfile.update({
      where: { userId: doctor.id },
      data: { clinicAddress: doctor.doctorProfile?.clinicAddress || null },
    });
    console.log('RESTORED');
  }
}

main()
  .catch((e) => {
    console.error('ERR', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
