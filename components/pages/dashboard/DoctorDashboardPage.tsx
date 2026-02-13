"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { DoctorAnalytics } from "@/components/dashboard/DoctorAnalytics"
import DoctorScheduleManager from "@/components/dashboard/DoctorScheduleManager"
import DoctorFinancialReports from "@/components/dashboard/DoctorFinancialReports"
import DoctorServicesManager from "@/components/dashboard/DoctorServicesManager"
import ClinicManager from "@/components/dashboard/ClinicManager"
import { Button } from "@/components/ui/button"
import { Calendar, DollarSign, Users, TrendingUp, Clock, Settings, FileText, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiService } from "@/services/api"
import { format } from "date-fns"
import { formatCurrency } from "@/utils/helpers"
import { socketService } from "@/services/socket"
import { toast } from "sonner"

import { useAppDispatch } from "@/app/hooks"
import { setUser } from "@/app/features/authSlice"

interface DoctorDashboardPageProps {
  user: any
}

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

export default function DoctorDashboardPage({ user }: DoctorDashboardPageProps) {
  const dispatch = useAppDispatch()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])

  useEffect(() => {
    // Check if clinicId is missing and refresh profile
    if (user && !user.clinicId) {
      const refreshProfile = async () => {
        try {
          const profile: any = await apiService.get("/auth/profile")
          if (profile && profile.clinicId) {
            console.log("Refreshing user profile to get clinicId:", profile.clinicId)
            dispatch(setUser(profile))
          }
        } catch (error) {
          console.error("Failed to refresh user profile:", error)
        }
      }
      refreshProfile()
    }
  }, [user, dispatch])

  useEffect(() => {
    // Wait for token to be ready before fetching
    const waitForToken = async () => {
      let attempts = 0
      const maxAttempts = 10

      while (attempts < maxAttempts) {
        const { getIdToken } = await import("@/lib/firebaseAuth")
        const token = await getIdToken()
        if (token) {
          console.log("✅ Token ready, fetching dashboard data...")
          fetchDashboardData()
          return
        }
        attempts++
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // If no token after max attempts, try anyway (might be public endpoint)
      console.warn("⚠️ No token after waiting, attempting fetch anyway...")
      fetchDashboardData()
    }

    waitForToken()

    // Socket connection for real-time updates
    const connectSocket = async () => {
      await socketService.connect()

      socketService.on("appointment:new", (newAppointment: any) => {
        toast.info(`New Appointment: ${newAppointment.patientName}`)
        fetchDashboardData(false)
      })

      socketService.on("appointment:update", () => {
        toast.info("Appointment updated")
        fetchDashboardData(false)
      })

      socketService.on("payment:update", () => {
        toast.info("Payment received")
        fetchDashboardData(false)
      })
    }

    connectSocket()

    const interval = setInterval(() => fetchDashboardData(false), 45000)

    return () => {
      clearInterval(interval)
      socketService.off("appointment:new")
      socketService.off("appointment:update")
      socketService.off("payment:update")
    }
  }, [])

  const emptyStats = {
    today: { appointments: 0, revenue: 0, patients: 0, cancellations: 0 },
    yesterday: { appointments: 0, revenue: 0, patients: 0, cancellations: 0 },
    thisWeek: { appointments: 0, revenue: 0, patients: 0, cancellations: 0 },
    thisMonth: { appointments: 0, revenue: 0, patients: 0, cancellations: 0 },
    revenueData: [],
    patientGrowth: [],
    cancellationRate: 0,
  }

  const fetchDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true)
      else setRefreshing(true)

      const localDate = format(new Date(), "yyyy-MM-dd")

      // Fetch analytics and appointments in parallel so one failure doesn't block the other
      const [analyticsRes, appointmentsRes] = await Promise.allSettled([
        apiService.get(`/doctors/analytics?period=week&date=${localDate}`),
        apiService.get(`/appointments?date=${localDate}&limit=100`),
      ])

      const analyticsFulfilled = analyticsRes.status === "fulfilled"
      const appointmentsFulfilled = appointmentsRes.status === "fulfilled"
      const analyticsRejected = analyticsRes.status === "rejected" ? (analyticsRes as PromiseRejectedResult).reason : null
      const appointmentsRejected = appointmentsRes.status === "rejected" ? (appointmentsRes as PromiseRejectedResult).reason : null

      // Set stats from analytics or empty on failure
      if (analyticsFulfilled && analyticsRes.value) {
        const analyticsData = (analyticsRes.value as any)?.data || (analyticsRes.value as any)
        setStats(analyticsData || emptyStats)
      } else {
        setStats(emptyStats)
        if (analyticsRejected?.response?.status === 401) {
          toast.error("Session expired. Please sign in again.")
          setTimeout(() => { window.location.href = "/" }, 2000)
          return
        }
        if (analyticsRejected?.response?.status === 403) {
          toast.error("You don't have permission to access this data. Please complete your onboarding.")
        }
      }

      // Set appointments from list or empty on failure
      if (appointmentsFulfilled && appointmentsRes.value) {
        const appointmentsData = (appointmentsRes.value as any)?.data ?? (appointmentsRes.value as any)
        const rawList = Array.isArray(appointmentsData) ? appointmentsData : appointmentsData?.appointments ?? []
        const appointmentsList = rawList.map((apt: any) => ({
          ...apt,
          time: apt.time || (apt.scheduledAt ? format(new Date(apt.scheduledAt), "h:mm a") : "—"),
          patientName: apt.patientName || (apt.patient ? `${apt.patient.firstName || ""} ${apt.patient.lastName || ""}`.trim() || "Patient" : "Patient"),
        }))
        setTodayAppointments(appointmentsList)
      } else {
        setTodayAppointments([])
        if (appointmentsRejected?.response?.status === 401) {
          toast.error("Session expired. Please sign in again.")
          setTimeout(() => { window.location.href = "/" }, 2000)
          return
        }
        if (appointmentsRejected?.response?.status === 403) {
          toast.error("You don't have permission to access this data. Please complete your onboarding.")
        }
      }

      setLastUpdated(new Date())

      // Only show generic backend error if both requests failed with 5xx or network
      const analyticsFailed = !analyticsFulfilled && (analyticsRejected?.response?.status >= 500 || analyticsRejected?.code === "ERR_NETWORK")
      const appointmentsFailed = !appointmentsFulfilled && (appointmentsRejected?.response?.status >= 500 || appointmentsRejected?.code === "ERR_NETWORK")
      if (analyticsFailed && appointmentsFailed) {
        toast.error("Backend server error. Please try again later.")
      } else if (analyticsFailed || appointmentsFailed) {
        // One failed: log but don't toast so dashboard still feels usable
        console.warn("Dashboard partial load:", { analyticsFailed, appointmentsFailed })
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch dashboard data:", error)
      setStats(emptyStats)
      setTodayAppointments([])
      if (error.response?.status === 401) {
        toast.error("Session expired. Please sign in again.")
        setTimeout(() => { window.location.href = "/" }, 2000)
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to access this data. Please complete your onboarding.")
      } else if (error.code === "ERR_NETWORK" || !error.response) {
        toast.error(`Network Error: ${error.message || "Cannot connect"}. Check your connection and backend.`)
      } else if (error.response?.status >= 500) {
        toast.error("Backend server error. Please try again later.")
      } else {
        toast.error(error.response?.data?.message || error.response?.data?.error || error.message || "Failed to load dashboard. Please try again.")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => fetchDashboardData(false)

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
      value: formatCurrency(Math.abs(stats.today.revenue)),
      trend: {
        value: stats.yesterday.revenue === 0
          ? (stats.today.revenue > 0 ? 100 : 0)
          : Math.round(((Math.abs(stats.today.revenue) - Math.abs(stats.yesterday.revenue)) / Math.abs(stats.yesterday.revenue)) * 100),
        isPositive: Math.abs(stats.today.revenue) >= Math.abs(stats.yesterday.revenue),
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
        value: 0,
        label: `${stats.today.appointments - stats.today.patients} remaining`,
        isPositive: true
      },
      icon: Users,
      color: "green" as const,
      description: "Completed today",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(Math.abs(stats.thisMonth.revenue)),
      trend: {
        value: 0,
        label: "This month",
        isPositive: true
      },
      icon: TrendingUp,
      color: "indigo" as const,
      description: "Total monthly revenue",
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Doctor Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Welcome back, Dr. {user?.lastName}</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button asChild variant="outline">
            <Link href="/dashboard/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href="/profile">
              Update Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs sm:text-sm">Schedule</TabsTrigger>
          <TabsTrigger value="services" className="text-xs sm:text-sm">Services</TabsTrigger>
          <TabsTrigger value="clinic" className="text-xs sm:text-sm">Clinic</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm">Reports</TabsTrigger>
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
                      <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{apt.time}</p>
                            <p className="text-sm text-muted-foreground">{apt.patientName}</p>
                            <p className="text-xs text-muted-foreground">{apt.reason}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
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
                  <Link href="/profile">
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Revenue Summary</CardTitle>
                <CardDescription>
                  This month's financial overview
                  {lastUpdated && (
                    <span className="block text-xs mt-1 text-muted-foreground/80">
                      Updated {format(lastUpdated, "h:mm a")}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="ml-1.5 sr-only sm:not-sr-only">Refresh</span>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(Math.abs(stats.thisMonth.revenue))}</p>
                  <p className="text-xs text-muted-foreground">Consultation fees this month</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Appointments</p>
                  <p className="text-2xl font-bold">{stats.thisMonth.appointments}</p>
                  <p className="text-xs text-muted-foreground">Total scheduled</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average per Visit</p>
                  <p className="text-2xl font-bold">
                    {stats.thisMonth.patients > 0
                      ? formatCurrency(Math.abs(stats.thisMonth.revenue) / stats.thisMonth.patients)
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Revenue ÷ completed visits</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cancellation Rate</p>
                  <p className="text-2xl font-bold">{(stats.cancellationRate ?? 0).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <DoctorScheduleManager />
        </TabsContent>

        <TabsContent value="services">
          <DoctorServicesManager userId={user.id} />
        </TabsContent>

        <TabsContent value="clinic">
          <ClinicManager clinicId={user.clinicId} />
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
