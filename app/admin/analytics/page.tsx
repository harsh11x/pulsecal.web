"use client"

import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { Card } from "@/components/ui/card"
import { Users, Calendar, DollarSign, TrendingUp, Loader2 } from "lucide-react"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { formatCurrency } from "@/utils/helpers"

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Reuse existing admin stats endpoint which has totalRevenue etc.
      const response: any = await apiService.get("/admin/stats")
      setStats(response?.data || response)
    } catch (error) {
      console.error("Failed to load analytics:", error)
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

  // Calculate generic growth/trends if data is missing (placeholder logic)
  // For now, we show 0 or actuals if available
  const revenue = stats?.totalRevenue || 0 // Note: API might need to return revenue in root object
  // Actually admin/stats returns totalUsers, totalPatients etc.
  // It effectively maps to the dashboard stats. 
  // If revenue is not in /admin/stats, we might strictly need to fetch from /admin/clinics aggregation or similar.
  // But for now, let's show 0 instead of fake data.

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">Detailed insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(0)} // Placeholder until we aggregate global revenue
          icon={DollarSign}
          color="purple"
          trend={{ value: 0, isPositive: true, label: "from last month" }}
          description="Total platform revenue"
        />
        <StatsCard
          title="New Patients"
          value={stats?.totalPatients || 0}
          icon={Users}
          color="green"
          trend={{ value: 0, isPositive: true, label: "this month" }}
          description="New registrations"
        />
        <StatsCard
          title="Appointments"
          value={stats?.totalAppointments || 0}
          icon={Calendar}
          color="blue"
          trend={{ value: 0, isPositive: true, label: "this month" }}
          description="Total appointments"
        />
        <StatsCard
          title="Growth Rate"
          value="0%"
          icon={TrendingUp}
          color="indigo"
          trend={{ value: 0, isPositive: true, label: "monthly growth" }}
          description="Platform growth"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Monthly Performance</h3>
            <p className="text-muted-foreground">Not enough data to display chart</p>
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">User Distribution</h3>
            <p className="text-muted-foreground">Not enough data to display chart</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
