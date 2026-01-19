
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Override DATABASE_URL with DIRECT_URL if available for this script
if (process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];

    if (!email) {
        console.error('Please provide an email address as an argument.');
        console.error('Usage: npx tsx src/scripts/promoteAdmin.ts <email>');
        process.exit(1);
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        const updatedUser = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' },
        });

        console.log(`Successfully promoted ${updatedUser.email} (${updatedUser.firstName} ${updatedUser.lastName}) to ADMIN.`);
    } catch (error) {
        console.error('Error promoting user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
