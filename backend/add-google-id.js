require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addGoogleIdColumn() {
    try {
        console.log('Adding googleId column to users table...');

        // Add googleId column
        await prisma.$executeRawUnsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "googleId" TEXT;
    `);

        console.log('✓ googleId column added');

        // Create unique index
        await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_googleId_key ON users("googleId");
    `);

        console.log('✓ Unique index created');
        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

addGoogleIdColumn();
