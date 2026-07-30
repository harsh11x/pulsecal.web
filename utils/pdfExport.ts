import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { parseAmount } from "@/utils/helpers"

interface Transaction {
  id: string
  amount: number | string
  status: string
  description?: string
  createdAt: string
  paidAt?: string
  patient?: {
    firstName?: string
    lastName?: string
  }
  appointment?: {
    scheduledAt?: string
    date?: string
    time?: string
  }
}

interface ExportData {
  transactions: Transaction[]
  doctorName: string
  clinicName: string
  summary: {
    totalReceived: number
    totalPaidOut: number
    netRevenue: number
  }
}

export function exportRevenuePDF(data: ExportData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Color scheme
  const primaryColor: [number, number, number] = [16, 185, 129] // emerald-500
  const darkColor: [number, number, number] = [15, 23, 42] // slate-900
  const mutedColor: [number, number, number] = [100, 116, 139] // slate-500
  const lightBg: [number, number, number] = [240, 253, 244] // emerald-50

  // ── HEADER SECTION ──────────────────────────────────────────────
  // Top accent bar
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 4, "F")

  // Clinic name (centered, large)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(...darkColor)
  doc.text(data.clinicName || "PulseCal Clinic", pageWidth / 2, 22, { align: "center" })

  // Subtitle
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(...mutedColor)
  doc.text("Revenue & Billing Report", pageWidth / 2, 30, { align: "center" })

  // Divider line
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(20, 35, pageWidth - 20, 35)

  // ── DOCTOR INFO & DATE ──────────────────────────────────────────
  // Doctor name on the left
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(...darkColor)
  doc.text("Dr. " + data.doctorName, 20, 45)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...mutedColor)
  doc.text("Reporting Physician", 20, 51)

  // Date on the right
  const reportDate = format(new Date(), "MMMM dd, yyyy")
  const reportTime = format(new Date(), "h:mm a")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(...darkColor)
  doc.text(reportDate, pageWidth - 20, 45, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...mutedColor)
  doc.text("Generated at " + reportTime, pageWidth - 20, 51, { align: "right" })

  // ── SUMMARY BOXES ──────────────────────────────────────────────
  const summaryY = 60
  const boxWidth = (pageWidth - 50) / 3
  const boxHeight = 28

  // Total Received box
  doc.setFillColor(...lightBg)
  doc.roundedRect(20, summaryY, boxWidth, boxHeight, 3, 3, "F")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...mutedColor)
  doc.text("TOTAL RECEIVED", 28, summaryY + 9)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(22, 163, 74) // green-600
  doc.text("₹" + data.summary.totalReceived.toLocaleString("en-IN"), 28, summaryY + 20)

  // Subscription Paid box
  doc.setFillColor(255, 251, 235) // amber-50
  doc.roundedRect(20 + boxWidth + 5, summaryY, boxWidth, boxHeight, 3, 3, "F")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...mutedColor)
  doc.text("SUBSCRIPTION PAID", 28 + boxWidth + 5, summaryY + 9)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(217, 119, 6) // amber-600
  doc.text("₹" + data.summary.totalPaidOut.toLocaleString("en-IN"), 28 + boxWidth + 5, summaryY + 20)

  // Net Revenue box
  doc.setFillColor(248, 250, 252) // slate-50
  doc.roundedRect(20 + (boxWidth + 5) * 2, summaryY, boxWidth, boxHeight, 3, 3, "F")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...mutedColor)
  doc.text("NET REVENUE", 28 + (boxWidth + 5) * 2, summaryY + 9)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(...darkColor)
  const netRevenue = data.summary.totalReceived - data.summary.totalPaidOut
  doc.text("₹" + netRevenue.toLocaleString("en-IN"), 28 + (boxWidth + 5) * 2, summaryY + 20)

  // ── TRANSACTIONS TABLE ──────────────────────────────────────────
  const tableStartY = summaryY + boxHeight + 12

  // Section header
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(...darkColor)
  doc.text("Payment Transactions", 20, tableStartY)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...mutedColor)
  doc.text(`${data.transactions.length} transaction(s)`, 20, tableStartY + 6)

  // Table data
  const tableData = data.transactions.map((t) => {
    const patientName = t.patient
      ? `${t.patient.firstName || ""} ${t.patient.lastName || ""}`.trim() || "Patient"
      : "Patient"

    const appointmentDate = t.appointment?.scheduledAt || t.appointment?.date || t.createdAt
    const formattedDate = appointmentDate
      ? format(new Date(appointmentDate), "MMM dd, yyyy")
      : "—"
    const formattedTime = t.appointment?.time || (appointmentDate
      ? format(new Date(appointmentDate), "h:mm a")
      : "—")

    const amt = Math.abs(parseAmount(t.amount))
    const statusLabel = t.status === "COMPLETED" || t.status === "PAID" ? "Paid" : t.status

    return [
      patientName,
      t.description || "Consultation Fee",
      formattedDate,
      formattedTime,
      "₹" + amt.toLocaleString("en-IN"),
      statusLabel,
    ]
  })

  autoTable(doc, {
    startY: tableStartY + 10,
    head: [["Patient Name", "Description", "Date", "Time", "Amount", "Status"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkColor,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: "bold" },
      1: { cellWidth: 35 },
      2: { cellWidth: 30, halign: "center" },
      3: { cellWidth: 25, halign: "center" },
      4: { cellWidth: 28, halign: "right", fontStyle: "bold" },
      5: { cellWidth: 22, halign: "center" },
    },
    margin: { left: 20, right: 20 },
    didDrawPage: (hookData) => {
      // Footer on every page
      const footerY = doc.internal.pageSize.getHeight() - 15
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.3)
      doc.line(20, footerY, pageWidth - 20, footerY)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(...mutedColor)
      doc.text("Generated by PulseCal — Healthcare Management Platform", 20, footerY + 5)
      const { pageNumber, totalPages } = hookData as unknown as { pageNumber: number; totalPages: number }
      doc.text(
        `Page ${pageNumber} of ${totalPages}`,
        pageWidth - 20,
        footerY + 5,
        { align: "right" }
      )
    },
  })

  // Save the PDF
  const fileName = `revenue-report-${format(new Date(), "yyyy-MM-dd")}.pdf`
  doc.save(fileName)
}
