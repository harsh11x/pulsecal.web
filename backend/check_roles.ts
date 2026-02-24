
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const roles = await prisma.user.findMany({ select: { role: true }, distinct: ['role'] });
    console.log(JSON.stringify(roles, null, 2));
    await prisma.$disconnect();
}
main();
