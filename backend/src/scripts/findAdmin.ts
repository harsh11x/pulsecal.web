import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
const result = dotenv.config({ path: path.join(__dirname, '../../.env') });

// Override DATABASE_URL with DIRECT_URL if available for this script
if (process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL;
    console.log('Using DIRECT_URL for connection...');
}

const prisma = new PrismaClient();

async function main() {
    try {
        const admins = await prisma.user.findMany({
            where: {
                role: 'ADMIN',
            },
            select: {
                email: true,
                firstName: true,
                lastName: true,
            },
        });

        if (admins.length === 0) {
            console.log('No ADMIN users found in the database.');
        } else {
            console.log('Found ADMIN users:');
            admins.forEach((admin) => {
                console.log(`- ${admin.email} (${admin.firstName} ${admin.lastName})`);
            });
        }
    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
