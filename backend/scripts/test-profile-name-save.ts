import prisma from '../src/config/database';
import { updateProfile } from '../src/modules/users/users.service';

async function main() {
  const user = await prisma.user.findFirst({
    where: { deletedAt: null, role: { in: ['DOCTOR', 'PATIENT', 'RECEPTIONIST'] } },
    select: { id: true, firstName: true, lastName: true, phone: true, role: true },
  });
  if (!user) {
    console.log('NO_USER');
    return;
  }

  const marker = `SaveTest${Date.now().toString().slice(-4)}`;
  const updated = await updateProfile(user.id, {
    firstName: marker,
    lastName: user.lastName || 'User',
    phone: user.phone || '9999999999',
  });

  const fromDb = await prisma.user.findUnique({
    where: { id: user.id },
    select: { firstName: true, lastName: true, phone: true },
  });

  console.log('ROLE', user.role);
  console.log('UPDATED_RETURN', updated?.firstName);
  console.log('DB_VALUE', fromDb?.firstName);
  console.log('TEST_RESULT', fromDb?.firstName === marker ? 'PASS' : 'FAIL');

  // restore
  await updateProfile(user.id, {
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
  });
  console.log('RESTORED');
}

main()
  .catch((e) => {
    console.error('ERR', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
