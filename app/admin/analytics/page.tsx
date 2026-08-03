"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Users, Calendar, Building2, TrendingUp, Loader2, Stethoscope } from "lucide-react"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { formatCurrency } from "@/utils/helpers"
import { adminService } from "@/services/admin.service"
import { toast } from "sonner"

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [clinicRevenue, setClinicRevenue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [systemStats, clinics] = await Promise.all([
        adminService.getStats(),
        adminService.getClinics(),
      ])
      setStats(systemStats)
      setClinicRevenue(
        clinics.reduce((sum: number, c: any) => sum + (Number(c.totalRevenue) || 0), 0)
      )
    } catch (error) {
      console.error("Failed to load analytics:", error)
      toast.error("Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">Detailed insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(clinicRevenue)}
          icon={TrendingUp}
          color="purple"
          description="Lifetime clinic revenue"
        />
        <StatsCard
          title="Patients"
          value={stats?.totalPatients || 0}
          icon={Users}
          color="green"
          description="Registered patients"
        />
        <StatsCard
          title="Doctors"
          value={stats?.totalDoctors || 0}
          icon={Stethoscope}
          color="blue"
          description="Active doctors"
        />
        <StatsCard
          title="Clinics"
          value={stats?.totalClinics || 0}
          icon={Building2}
          color="indigo"
          description="Registered clinics"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Appointments</h3>
          <p className="text-3xl font-bold mt-2">{stats?.totalAppointments || 0}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Active Appointments</h3>
          <p className="text-3xl font-bold mt-2">{stats?.activeAppointments || 0}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Medical Records</h3>
          <p className="text-3xl font-bold mt-2">{stats?.totalMedicalRecords || 0}</p>
        </Card>
      </div>
    </div>
  )
}
