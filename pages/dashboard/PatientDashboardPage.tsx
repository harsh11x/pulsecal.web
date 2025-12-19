"use client"

import { useAppSelector } from "@/app/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { UpcomingAppointmentsCard } from "@/components/dashboard/UpcomingAppointmentsCard"
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Search, Stethoscope } from "lucide-react"
import Link from "next/link"
import { DoctorDiscoveryMap } from "@/components/doctors/DoctorDiscoveryMap"

export default function PatientDashboardPage() {
  const user = useAppSelector((state) => state.auth.user)

  const stats = [
    {
      title: "Upcoming Appointments",
      value: 3,
      trend: { label: "2 this week", isPositive: true },
      icon: Calendar,
      color: "blue" as const,
      description: "Scheduled visits",
    },
    {
      title: "Active Prescriptions",
      value: 2,
      trend: { label: "All current", isPositive: true },
      icon: Stethoscope,
      color: "green" as const,
      description: "Active medications",
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

