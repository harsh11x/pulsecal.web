
import prisma from '../config/database';

async function main() {
    try {
        const start = Date.now();
        const aptId = '9f549dca-0a53-4d72-930b-15d1cceaddee';
        console.log(`Deleting appointment: ${aptId}`);
        await prisma.appointment.delete({ where: { id: aptId } });
        console.log(`✅ successfully deleted appointment in ${Date.now() - start}ms`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
