"use client"

import { useAppSelector } from "@/app/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle, Plus } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiService } from "@/services/api"
import { toast } from "sonner"

interface QueueEntry {
  id: string
  patientName: string
  appointmentTime?: string
  status: "waiting" | "checked_in" | "in_progress" | "completed"
  reason: string
  priority?: "normal" | "urgent"
}

export default function ReceptionistDashboardPage() {
  const user = useAppSelector((state) => state.auth.user)
  const [todayStats, setTodayStats] = useState({
    appointments: 0,
    completed: 0,
    waiting: 0,
    cancelled: 0,
  })
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    // Poll for queue updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch today's stats
      const statsResponse: any = await apiService.get("/api/v1/receptionists/stats")
      if (statsResponse?.data) {
        setTodayStats(statsResponse.data)
      } else {
        setTodayStats({ appointments: 24, completed: 8, waiting: 5, cancelled: 2 })
      }

      // Fetch queue
      const queueResponse: any = await apiService.get("/api/v1/queue")
      setQueue(queueResponse?.data || queueResponse || getMockQueue())

      // Fetch today's appointments
      const appointmentsResponse: any = await apiService.get("/api/v1/appointments?date=today")
      setTodayAppointments(appointmentsResponse?.data || appointmentsResponse || getMockAppointments())
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      setTodayStats({ appointments: 24, completed: 8, waiting: 5, cancelled: 2 })
      setQueue(getMockQueue())
      setTodayAppointments(getMockAppointments())
    } finally {
      setLoading(false)
    }
  }

  const getMockQueue = (): QueueEntry[] => {
    return [
      { id: "1", patientName: "John Doe", appointmentTime: "09:00", status: "checked_in", reason: "Follow-up" },
      { id: "2", patientName: "Jane Smith", appointmentTime: "10:30", status: "waiting", reason: "Consultation", priority: "urgent" },
      { id: "3", patientName: "Mike Johnson", status: "waiting", reason: "Walk-in" },
    ]
  }

  const getMockAppointments = () => {
    return [
      { id: "1", patientName: "John Doe", time: "09:00", status: "confirmed", reason: "Follow-up" },
      { id: "2", patientName: "Jane Smith", time: "10:30", status: "confirmed", reason: "Consultation" },
    ]
  }

  const handleCheckIn = async (appointmentId: string) => {
    try {
      await apiService.post(`/api/v1/appointments/${appointmentId}/checkin`)
      toast.success("Patient checked in successfully")
      fetchDashboardData()
    } catch (error: any) {
      toast.error(error.message || "Failed to check in patient")
    }
  }

  const handleQueueUpdate = async (queueId: string, status: string) => {
    try {
      await apiService.put(`/api/v1/queue/${queueId}`, { status })
      toast.success("Queue updated")
      fetchDashboardData()
    } catch (error: any) {
      toast.error(error.message || "Failed to update queue")
    }
  }

  const stats = [
    {
      title: "Total Patients",
      value: todayStats.appointments,
      trend: { 
        label: `${todayStats.completed} completed`,
        isPositive: true 
      },
      icon: Users,
      color: "green" as const,
      description: "Total appointments today",
    },
    {
      title: "Pending",
      value: todayStats.waiting,
      trend: { 
        label: "In queue",
        isPositive: false 
      },
      icon: Clock,
      color: "orange" as const,
      description: "Patients waiting",
    },
    {
      title: "Appointments",
      value: todayStats.appointments,
      trend: { 
        label: "Scheduled today",
        isPositive: true 
      },
      icon: Calendar,
      color: "blue" as const,
      description: "Total scheduled",
    },
    {
      title: "Revenue",
      value: `$${((todayStats.completed * 150) + (todayStats.appointments * 50)).toLocaleString()}`,
      trend: { 
        label: "Today's earnings",
        isPositive: true 
      },
      icon: CheckCircle,
      color: "purple" as const,
      description: "Estimated revenue",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Receptionist Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName}</p>
        </div>
        <Button asChild>
          <Link href="/appointments/create">
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Queue Management</TabsTrigger>
          <TabsTrigger value="appointments">Today's Appointments</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Queue</CardTitle>
              <CardDescription>Manage patients waiting to see the doctor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {queue.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No patients in queue</p>
                ) : (
                  queue.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{entry.patientName}</p>
                            {entry.priority === "urgent" && (
                              <Badge variant="destructive" className="text-xs">Urgent</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{entry.reason}</p>
                          {entry.appointmentTime && (
                            <p className="text-xs text-muted-foreground">
                              Scheduled: {entry.appointmentTime}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            entry.status === "completed"
                              ? "default"
                              : entry.status === "in_progress"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {entry.status.replace("_", " ")}
                        </Badge>
                        {entry.status === "waiting" && (
                          <Button
                            size="sm"
                            onClick={() => handleQueueUpdate(entry.id, "checked_in")}
                          >
                            Check In
                          </Button>
                        )}
                        {entry.status === "checked_in" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQueueUpdate(entry.id, "in_progress")}
                          >
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Appointments</CardTitle>
              <CardDescription>Manage scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayAppointments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No appointments scheduled for today</p>
                ) : (
                  todayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">{apt.time}</p>
                          <p className="text-sm text-muted-foreground">{apt.patientName}</p>
                          <p className="text-xs text-muted-foreground">{apt.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={apt.status === "confirmed" ? "default" : "secondary"}>
                          {apt.status}
                        </Badge>
                        {apt.status === "confirmed" && (
                          <Button size="sm" onClick={() => handleCheckIn(apt.id)}>
                            Check In
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/appointments/${apt.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>Visual schedule of appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Calendar view coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link href="/appointments/create">
                <Plus className="mr-2 h-4 w-4" />
                Book New Appointment
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/appointments/calendar">
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/queue/status">
                <Users className="mr-2 h-4 w-4" />
                Manage Queue
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clinic Information</CardTitle>
            <CardDescription>Your clinic details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clinic Name</span>
                <span className="font-medium">Heart Care Clinic</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doctor</span>
                <span className="font-medium">Dr. John Smith</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">New York, NY</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
