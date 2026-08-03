import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import fs from 'fs'
import path from 'path'

// Mirror of exportAnalyticsPDF but writes to disk for local Node verification
const data = {
  doctorName: 'Test Doctor',
  clinicName: 'PulseCal Test Clinic',
  today: { appointments: 3, revenue: 1500, patients: 3, cancellations: 0 },
  yesterday: { appointments: 2, revenue: 1000, patients: 2, cancellations: 1 },
  thisWeek: { appointments: 10, revenue: 5000, patients: 8, cancellations: 1 },
  thisMonth: { appointments: 40, revenue: 20000, patients: 30, cancellations: 4 },
  revenueData: [
    { date: '2026-08-01', revenue: 2000, appointments: 4 },
    { date: '2026-08-02', revenue: 2500, appointments: 5 },
  ],
  patientGrowth: [
    { month: 'Jun', patients: 10 },
    { month: 'Jul', patients: 18 },
  ],
  cancellationRate: 8.5,
}

const doc = new jsPDF()
const pageWidth = doc.internal.pageSize.getWidth()
doc.setFont('helvetica', 'bold')
doc.setFontSize(18)
doc.text(data.clinicName, pageWidth / 2, 20, { align: 'center' })
doc.setFontSize(12)
doc.text('Practice Analytics Report', pageWidth / 2, 28, { align: 'center' })

autoTable(doc, {
  startY: 40,
  head: [['Period', 'Appointments', 'Revenue', 'Patients', 'Cancellations']],
  body: [
    ['Today', String(data.today.appointments), String(data.today.revenue), String(data.today.patients), String(data.today.cancellations)],
    ['This Month', String(data.thisMonth.appointments), String(data.thisMonth.revenue), String(data.thisMonth.patients), String(data.thisMonth.cancellations)],
  ],
})

autoTable(doc, {
  startY: (doc as any).lastAutoTable.finalY + 10,
  head: [['Date', 'Revenue', 'Appointments']],
  body: data.revenueData.map((r) => [r.date, String(r.revenue), String(r.appointments)]),
})

const out = path.join(process.cwd(), 'scripts', `analytics-report-test-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
const buf = Buffer.from(doc.output('arraybuffer'))
fs.writeFileSync(out, buf)
console.log('WROTE', out, 'BYTES', buf.length)
if (buf.length < 500) process.exit(1)
