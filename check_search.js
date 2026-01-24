
const { searchDoctors } = require('../backend/dist/modules/doctors/doctors.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSearch() {
    try {
        console.log("Searching doctors...");
        const result = await searchDoctors({ limit: 1 });
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testSearch();
