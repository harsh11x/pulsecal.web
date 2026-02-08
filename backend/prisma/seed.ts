/**
 * Seed script: creates sample doctor(s) and clinic(s) so "Find Doctors" / "Browse Clinics" show data.
 * Run with: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const existingDoctor = await prisma.doctorProfile.findFirst();
  if (existingDoctor) {
    console.log('Doctors and/or clinics already exist. Seed skipped.');
    return;
  }

  const hashedPassword = await bcrypt.hash('SeedDoctor@123', 10);

  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor-seed@pulsecal.local' },
    update: {},
    create: {
      email: 'doctor-seed@pulsecal.local',
      firstName: 'Sample',
      lastName: 'Doctor',
      role: 'DOCTOR',
      isActive: true,
      password: hashedPassword,
      onboardingCompleted: true,
    },
  });

  await prisma.doctorProfile.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      licenseNumber: `SEED-${Date.now()}`,
      specialization: 'General Physician',
      consultationFee: 500,
      clinicName: 'PulseCal Demo Clinic',
      clinicAddress: '123 Health Street, Amritsar',
    },
  });

  const existingClinic = await prisma.clinic.findFirst();
  const clinic = existingClinic ?? await prisma.clinic.create({
    data: {
      name: 'PulseCal Demo Clinic',
      address: '123 Health Street',
      city: 'Amritsar',
      state: 'Punjab',
      zipCode: '143001',
      country: 'India',
      phone: '9876543210',
      isActive: true,
      subscriptionStatus: 'ACTIVE',
    },
  });

  await prisma.user.update({
    where: { id: doctorUser.id },
    data: { clinicId: clinic.id },
  });

  console.log('Seed done: 1 doctor and 1 clinic created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
