"use client"

import { useAppSelector } from "@/app/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { DoctorAnalytics } from "@/components/dashboard/DoctorAnalytics"
import DoctorScheduleManager from "@/components/dashboard/DoctorScheduleManager"
import DoctorFinancialReports from "@/components/dashboard/DoctorFinancialReports"
import { Button } from "@/components/ui/button"
import { Calendar, DollarSign, Users, TrendingUp, Clock, Settings, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiService } from "@/services/api"

interface DashboardStats {
  today: {
    appointments: number
    revenue: number
    patients: number
    cancellations: number
  }
  yesterday: {
    appointments: number
    revenue: number
    patients: number
    cancellations: number
  }
  thisWeek: {
    appointments: number
    revenue: number
    patients: number
    cancellations: number
  }
  thisMonth: {
    appointments: number
    revenue: number
    patients: number
    cancellations: number
  }
  revenueData: Array<{ date: string; revenue: number; appointments: number }>
  patientGrowth: Array<{ month: string; patients: number }>
  cancellationRate: number
}

export default function DoctorDashboardPage() {
  const user = useAppSelector((state) => state.auth.user)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch analytics data
      const analyticsResponse: any = await apiService.get("/api/v1/doctors/analytics")
      if (analyticsResponse?.data) {
        setStats(analyticsResponse.data)
      } else {
        // Use mock data if backend unavailable
        setStats(getMockAnalytics())
      }

      // Fetch today's appointments
      const appointmentsResponse: any = await apiService.get("/api/v1/appointments?date=today")
      setTodayAppointments(appointmentsResponse?.data || appointmentsResponse || getMockAppointments())
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      setStats(getMockAnalytics())
      setTodayAppointments(getMockAppointments())
    } finally {
      setLoading(false)
    }
  }

  const getMockAnalytics = (): DashboardStats => {
    return {
      today: { appointments: 12, revenue: 2400, patients: 8, cancellations: 1 },
      yesterday: { appointments: 10, revenue: 2000, patients: 7, cancellations: 0 },
      thisWeek: { appointments: 65, revenue: 13000, patients: 45, cancellations: 3 },
      thisMonth: { appointments: 234, revenue: 45231, patients: 156, cancellations: 12 },
      revenueData: [
        { date: "Mon", revenue: 2000, appointments: 10 },
        { date: "Tue", revenue: 2200, appointments: 11 },
        { date: "Wed", revenue: 1800, appointments: 9 },
        { date: "Thu", revenue: 2400, appointments: 12 },
        { date: "Fri", revenue: 2600, appointments: 13 },
        { date: "Sat", revenue: 2000, appointments: 10 },
      ],
      patientGrowth: [
        { month: "Jan", patients: 45 },
        { month: "Feb", patients: 52 },
        { month: "Mar", patients: 48 },
        { month: "Apr", patients: 61 },
        { month: "May", patients: 58 },
        { month: "Jun", patients: 67 },
      ],
      cancellationRate: 5.1,
    }
  }

  const getMockAppointments = () => {
    return [
      { id: "1", patientName: "John Doe", time: "09:00", status: "confirmed", reason: "Follow-up" },
      { id: "2", patientName: "Jane Smith", time: "10:30", status: "confirmed", reason: "Consultation" },
      { id: "3", patientName: "Mike Johnson", time: "14:00", status: "pending", reason: "Checkup" },
    ]
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const dashboardStats = [
    {
      title: "Today's Appointments",
      value: stats.today.appointments,
      trend: { 
        value: stats.today.appointments - stats.yesterday.appointments,
        isPositive: stats.today.appointments >= stats.yesterday.appointments,
        label: "from yesterday"
      },
      icon: Calendar,
      color: "blue" as const,
      description: "Scheduled today",
    },
    {
      title: "Today's Revenue",
      value: `$${stats.today.revenue.toLocaleString()}`,
      trend: { 
        value: Math.round(((stats.today.revenue - stats.yesterday.revenue) / stats.yesterday.revenue) * 100),
        isPositive: stats.today.revenue >= stats.yesterday.revenue,
        label: "from yesterday"
      },
      icon: DollarSign,
      color: "purple" as const,
      description: "Revenue earned today",
    },
    {
      title: "Patients Seen",
      value: stats.today.patients,
      trend: { 
        label: `${stats.today.appointments - stats.today.patients} remaining`,
        isPositive: true
      },
      icon: Users,
      color: "green" as const,
      description: "Completed today",
    },
    {
      title: "Monthly Revenue",
      value: `$${stats.thisMonth.revenue.toLocaleString()}`,
      trend: { 
        label: "This month",
        isPositive: true
      },
      icon: TrendingUp,
      color: "indigo" as const,
      description: "Total monthly revenue",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Dr. {user?.lastName}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/profile">
              Update Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatsCard 
            key={stat.title} 
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            color={stat.color}
            description={stat.description}
          />
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Your appointments for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayAppointments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No appointments scheduled for today</p>
                  ) : (
                    todayAppointments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{apt.time}</p>
                            <p className="text-sm text-muted-foreground">{apt.patientName}</p>
                            <p className="text-xs text-muted-foreground">{apt.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={apt.status === "confirmed" ? "default" : "secondary"}>
                            {apt.status}
                          </Badge>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/appointments/${apt.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                  <Button asChild className="w-full mt-4">
                    <Link href="/appointments/list">View All Appointments</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your practice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full justify-start">
                  <Link href="/dashboard/profile">
                    <Users className="mr-2 h-4 w-4" />
                    Update Profile & Services
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/schedule">
                    <Clock className="mr-2 h-4 w-4" />
                    Manage Schedule & Availability
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/staff">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Clinic Staff
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/reports">
                    <FileText className="mr-2 h-4 w-4" />
                    View Financial Reports
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Summary</CardTitle>
              <CardDescription>This month's financial overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${stats.thisMonth.revenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Appointments</p>
                  <p className="text-2xl font-bold">{stats.thisMonth.appointments}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average per Visit</p>
                  <p className="text-2xl font-bold">
                    ${(stats.thisMonth.revenue / stats.thisMonth.appointments || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cancellation Rate</p>
                  <p className="text-2xl font-bold">{stats.cancellationRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <DoctorScheduleManager />
        </TabsContent>

        <TabsContent value="analytics">
          <DoctorAnalytics data={stats} />
        </TabsContent>

        <TabsContent value="reports">
          <DoctorFinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}
