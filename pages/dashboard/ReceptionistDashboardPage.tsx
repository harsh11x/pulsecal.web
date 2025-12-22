"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle, Plus, Phone, Mail, MapPin, Building2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiService } from "@/services/api"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ReceptionistDashboardPageProps {
  user: any
}

interface QueueEntry {
  id: string
  patientName: string
  appointmentTime?: string
  status: "waiting" | "checked_in" | "in_progress" | "completed"
  reason: string
  priority?: "normal" | "urgent"
  phone?: string
}

interface Appointment {
  id: string
  patientName: string
  time: string
  status: string
  reason: string
  phone?: string
  email?: string
}

import { socketService } from "@/services/socket"

// ... imports

export default function ReceptionistDashboardPage({ user }: ReceptionistDashboardPageProps) {
  const [todayStats, setTodayStats] = useState({
    appointments: 0,
    completed: 0,
    waiting: 0,
    cancelled: 0,
    inProgress: 0,
  })
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [clinicInfo, setClinicInfo] = useState<{
    name: string
    address: string
    city: string
    phone: string
    email: string
  } | null>(null)


  useEffect(() => {
    fetchDashboardData()

    // Socket connection
    const connectSocket = async () => {
      await socketService.connect()

      socketService.on("appointment:new", (data: any) => {
        toast.info("New appointment booked")
        fetchDashboardData()
      })

      socketService.on("appointment:update", (data: any) => {
        fetchDashboardData()
      })

      socketService.on("queue:update", (data: any) => {
        fetchDashboardData()
      })
    }

    connectSocket()

    // Poll for queue updates every 60 seconds as fallback
    const interval = setInterval(fetchDashboardData, 60000)

    return () => {
      clearInterval(interval)
      socketService.off("appointment:new")
      socketService.off("appointment:update")
      socketService.off("queue:update")
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch today's stats
      const statsResponse: any = await apiService.get("/api/v1/receptionists/stats")
      if (statsResponse?.data?.stats) {
        setTodayStats(statsResponse.data.stats)
      } else {
        setTodayStats({ appointments: 0, completed: 0, waiting: 0, cancelled: 0, inProgress: 0 })
      }

      if (statsResponse?.data?.clinic) {
        setClinicInfo(statsResponse.data.clinic)
      }

      // Fetch queue
      const queueResponse: any = await apiService.get("/api/v1/receptionists/queue")
      setQueue(queueResponse?.data || [])

      // Fetch today's appointments
      const appointmentsResponse: any = await apiService.get("/api/v1/appointments?date=today")
      const appointments = appointmentsResponse?.data || []
      setTodayAppointments(Array.isArray(appointments) ? appointments : appointments.appointments || [])
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      toast.error("Failed to update dashboard")
    } finally {
      setLoading(false)
    }
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
        value: 0,
        label: `${todayStats.completed} completed`,
        isPositive: true
      },
      icon: Users,
      color: "green" as const,
      description: "Total appointments today",
    },
    {
      title: "Waiting",
      value: todayStats.waiting,
      trend: {
        value: 0,
        label: "In queue",
        isPositive: false
      },
      icon: Clock,
      color: "orange" as const,
      description: "Patients waiting",
    },
    {
      title: "In Progress",
      value: todayStats.inProgress,
      trend: {
        value: 0,
        label: "Currently seeing doctor",
        isPositive: true
      },
      icon: AlertCircle,
      color: "blue" as const,
      description: "Active consultations",
    },
    {
      title: "Completed",
      value: todayStats.completed,
      trend: {
        value: 0,
        label: "Finished today",
        isPositive: true
      },
      icon: CheckCircle,
      color: "purple" as const,
      description: "Completed appointments",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Receptionist Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName}! Manage your clinic operations</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/appointments/calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/appointments/create">
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue">Patient Queue</TabsTrigger>
          <TabsTrigger value="appointments">Today's Schedule</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* Queue Management Tab */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Patient Queue</CardTitle>
                  <CardDescription>Manage patients waiting to see the doctor</CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {queue.filter(q => q.status === "waiting" || q.status === "checked_in").length} Waiting
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No patients in queue</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queue.map((entry, index) => (
                    <Card
                      key={entry.id}
                      className={`transition-all hover:shadow-md ${entry.priority === "urgent" ? "border-red-300 bg-red-50/50" : ""
                        }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${entry.status === "completed" ? "bg-green-100 text-green-700" :
                              entry.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                                entry.status === "checked_in" ? "bg-purple-100 text-purple-700" :
                                  "bg-orange-100 text-orange-700"
                              }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-lg">{entry.patientName}</p>
                                {entry.priority === "urgent" && (
                                  <Badge variant="destructive" className="text-xs">Urgent</Badge>
                                )}
                                <Badge
                                  variant={
                                    entry.status === "completed"
                                      ? "default"
                                      : entry.status === "in_progress"
                                        ? "secondary"
                                        : entry.status === "checked_in"
                                          ? "outline"
                                          : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {entry.status.replace("_", " ").toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">{entry.reason}</p>
                              {entry.appointmentTime && (
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {entry.appointmentTime}
                                  </span>
                                  {entry.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {entry.phone}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
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
                                variant="default"
                                onClick={() => handleQueueUpdate(entry.id, "in_progress")}
                              >
                                Start Consultation
                              </Button>
                            )}
                            {entry.status === "in_progress" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQueueUpdate(entry.id, "completed")}
                              >
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Today's Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Today's Appointments</CardTitle>
                  <CardDescription>Manage scheduled appointments for today</CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {todayAppointments.length} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {todayAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No appointments scheduled for today</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayAppointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell className="font-medium">{apt.time}</TableCell>
                        <TableCell>{apt.patientName}</TableCell>
                        <TableCell className="text-muted-foreground">{apt.reason}</TableCell>
                        <TableCell>
                          {apt.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {apt.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={apt.status === "confirmed" ? "default" : "secondary"}>
                            {apt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {apt.status === "confirmed" && (
                              <Button size="sm" onClick={() => handleCheckIn(apt.id)}>
                                Check In
                              </Button>
                            )}
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/appointments/${apt.id}`}>View</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
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
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/patients">
                    <Users className="mr-2 h-4 w-4" />
                    Patient Directory
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
                {clinicInfo ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold">{clinicInfo.name}</p>
                        <p className="text-sm text-muted-foreground">{clinicInfo.address}</p>
                        <p className="text-sm text-muted-foreground">{clinicInfo.city}</p>
                      </div>
                    </div>
                    {clinicInfo.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{clinicInfo.phone}</span>
                      </div>
                    )}
                    {clinicInfo.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{clinicInfo.email}</span>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full">
                      <MapPin className="mr-2 h-4 w-4" />
                      View on Map
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-6 text-muted-foreground">
                    <p>No clinic information available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
              <CardDescription>Quick overview of today's operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">{todayStats.appointments}</p>
                  <p className="text-sm text-muted-foreground">Total Appointments</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{todayStats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{todayStats.waiting}</p>
                  <p className="text-sm text-muted-foreground">Waiting</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{todayStats.cancelled}</p>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
