"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, TrendingUp, Users, DollarSign, Loader2 } from "lucide-react"
import { adminService } from "@/services/admin.service"
import { toast } from "sonner"

export default function ReportsPage() {
  const [busy, setBusy] = useState<string | null>(null)

  const reports = [
    {
      id: "system",
      title: "System Overview Report",
      description: "Users, clinics, appointments and records snapshot",
      icon: FileText,
      color: "bg-primary",
    },
    {
      id: "clinics",
      title: "Clinics Revenue Report",
      description: "Per-clinic bookings, doctors and revenue",
      icon: DollarSign,
      color: "bg-emerald-600",
    },
    {
      id: "growth",
      title: "User Growth Report",
      description: "Patient, doctor and total user counts",
      icon: Users,
      color: "bg-violet-600",
    },
    {
      id: "performance",
      title: "Performance Metrics",
      description: "Active appointments and record volume",
      icon: TrendingUp,
      color: "bg-amber-600",
    },
  ]

  const downloadJson = (filename: string, payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownload = async (reportId: string, reportTitle: string) => {
    try {
      setBusy(reportId)
      const [stats, clinics] = await Promise.all([
        adminService.getStats(),
        adminService.getClinics(),
      ])

      const generatedAt = new Date().toISOString()
      let payload: unknown = { generatedAt, stats }

      if (reportId === "clinics") {
        payload = {
          generatedAt,
          totalClinics: clinics.length,
          totalRevenue: clinics.reduce((s: number, c: any) => s + (c.totalRevenue || 0), 0),
          clinics,
        }
      } else if (reportId === "growth") {
        payload = {
          generatedAt,
          totalUsers: stats?.totalUsers || 0,
          totalPatients: stats?.totalPatients || 0,
          totalDoctors: stats?.totalDoctors || 0,
          totalClinics: stats?.totalClinics || 0,
        }
      } else if (reportId === "performance") {
        payload = {
          generatedAt,
          totalAppointments: stats?.totalAppointments || 0,
          activeAppointments: stats?.activeAppointments || 0,
          totalMedicalRecords: stats?.totalMedicalRecords || 0,
          totalPrescriptions: stats?.totalPrescriptions || 0,
        }
      }

      downloadJson(`${reportId}-report-${Date.now()}.json`, payload)
      toast.success(`${reportTitle} downloaded`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to generate report")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-2">Generate and download system reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${report.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                  <Button
                    size="sm"
                    disabled={busy === report.id}
                    onClick={() => handleDownload(report.id, report.title)}
                  >
                    {busy === report.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download Report
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
