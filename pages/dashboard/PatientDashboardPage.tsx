"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { UpcomingAppointmentsCard } from "@/components/dashboard/UpcomingAppointmentsCard"
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Search, Stethoscope } from "lucide-react"
import Link from "next/link"
import { DoctorDiscoveryMap } from "@/components/doctors/DoctorDiscoveryMap"
import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { toast } from "sonner"

interface PatientDashboardPageProps {
  user: any
}

export default function PatientDashboardPage({ user }: PatientDashboardPageProps) {
  const [statsData, setStatsData] = useState({
    upcomingAppointments: 0,
    activePrescriptions: 0,
    medicalRecords: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response: any = await apiService.get("/api/v1/patients/stats")
        setStatsData(response.data || { upcomingAppointments: 0, activePrescriptions: 0, medicalRecords: 0 })
      } catch (error) {
        console.error("Failed to fetch patient stats:", error)
        // toast.error("Failed to load dashboard data") // Optional: silent fail is sometimes better for dashboard widgets
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user])

  const stats = [
    {
      title: "Upcoming Appointments",
      value: statsData.upcomingAppointments,
      trend: { value: 0, label: "Scheduled visits", isPositive: true },
      icon: Calendar,
      color: "blue" as const,
      description: "Next appointment details",
    },
    {
      title: "Active Prescriptions",
      value: statsData.activePrescriptions,
      trend: { value: 0, label: "Current medications", isPositive: true },
      icon: Stethoscope,
      color: "green" as const,
      description: "Active treatments",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.firstName}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your health</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {stats.map((stat) => (
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

      <div className="grid gap-4 md:grid-cols-2">
        <UpcomingAppointmentsCard appointments={[]} />
        <RecentActivityCard activities={[]} />
      </div>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Find Doctors Near You</CardTitle>
          <CardDescription>Discover and book appointments with doctors in your area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] rounded-lg overflow-hidden border">
            <DoctorDiscoveryMap />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/appointments/create">
                <Calendar className="mr-2 h-4 w-4" />
                Book Appointment
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/health/records">
                <Stethoscope className="mr-2 h-4 w-4" />
                View Medical Records
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

