
import { getDoctorAnalytics, getFinancialReports } from './src/modules/doctors/doctors.analytics.service';

async function testAnalyticsIsolation() {
    console.log('--- ANALYTICS ISOLATION TEST ---');

    const doctor1Id = '68ca4b2e-e533-40ed-810a-aeeb218764c0';
    const doctor2Id = 'b2991154-e9a3-48c7-9a1c-15e9d57ac36e';

    console.log(`\nTesting Analytics as Doctor 1: ${doctor1Id}`);
    const a1 = await getDoctorAnalytics(doctor1Id, 'month');
    console.log(`Monthly Appointments: ${a1.thisMonth.appointments}`);
    console.log(`Monthly Revenue: ${a1.thisMonth.revenue}`);

    console.log(`\nTesting Analytics as Doctor 2: ${doctor2Id}`);
    const a2 = await getDoctorAnalytics(doctor2Id, 'month');
    console.log(`Monthly Appointments: ${a2.thisMonth.appointments}`);
    console.log(`Monthly Revenue: ${a2.thisMonth.revenue}`);

    console.log('\n--- FINANCIAL REPORTS ISOLATION TEST ---');
    const f1 = await getFinancialReports(doctor1Id, 'monthly');
    console.log(`Doctor 1 Total Revenue: ${f1.totalRevenue}`);

    const f2 = await getFinancialReports(doctor2Id, 'monthly');
    console.log(`Doctor 2 Total Revenue: ${f2.totalRevenue}`);

    // Cross check counts
    // If pooling exists, they might show same numbers if they are in the same clinic
    if (a1.thisMonth.appointments === a2.thisMonth.appointments && a1.thisMonth.appointments > 0) {
        console.warn('[!] Suspicious: Doctor 1 and Doctor 2 have identical appointment counts.');
    } else {
        console.log('Success: Different counts detected.');
    }

    process.exit(0);
}

testAnalyticsIsolation().catch(console.error);
