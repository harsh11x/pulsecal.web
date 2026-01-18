"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle, Plus, Phone, Mail, MapPin, Building2, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiService } from "@/services/api"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { socketService } from "@/services/socket"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  patientName?: string
  patient?: { firstName: string; lastName: string; phone?: string; email?: string }
  doctor?: { firstName: string; lastName: string }
  scheduledAt: string
  status: string
  reason?: string
  clinic?: { name: string; address: string }
}

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
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [clinicInfo, setClinicInfo] = useState<{
    name: string
    address: string
    city: string
    phone: string
    email: string
  } | null>(null)
  
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [newScheduleDate, setNewScheduleDate] = useState("")
  const [newScheduleTime, setNewScheduleTime] = useState("")

  useEffect(() => {
    fetchDashboardData()

    // Socket connection for real-time updates
    const connectSocket = async () => {
      await socketService.connect()

      socketService.on("appointment:new", (data: any) => {
        toast.info("New appointment booked")
        fetchDashboardData()
      })

      socketService.on("appointment:update", (data: any) => {
        toast.info("Appointment updated")
        fetchDashboardData()
      })

      socketService.on("queue:update", (data: any) => {
        fetchDashboardData()
      })
    }

    connectSocket()

    // Poll for updates every 30 seconds as fallback
    const interval = setInterval(fetchDashboardData, 30000)

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
      const todayResponse: any = await apiService.get("/api/v1/appointments?date=today")
      const todayApts = todayResponse?.data || []
      setTodayAppointments(Array.isArray(todayApts) ? todayApts : todayApts.appointments || [])

      // Fetch all appointments for the clinic
      const allResponse: any = await apiService.get("/api/v1/appointments")
      const allApts = allResponse?.data || []
      setAllAppointments(Array.isArray(allApts) ? allApts : allApts.appointments || [])
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error)
      if (error.response?.status !== 403) {
        toast.error("Failed to update dashboard")
      }
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

  const handleCancelAppointment = async () => {
    if (!cancelId) return
    try {
      await apiService.post(`/api/v1/appointments/${cancelId}/cancel`, {
        cancellationReason: "Cancelled by receptionist"
      })
      toast.success("Appointment cancelled successfully")
      setCancelId(null)
      fetchDashboardData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel appointment")
    }
  }

  const handleRescheduleAppointment = async () => {
    if (!rescheduleId || !newScheduleDate || !newScheduleTime) {
      toast.error("Please select both date and time")
      return
    }
    
    try {
      const scheduledAt = new Date(`${newScheduleDate}T${newScheduleTime}`)
      await apiService.post(`/api/v1/appointments/${rescheduleId}/reschedule`, {
        scheduledAt: scheduledAt.toISOString()
      })
      toast.success("Appointment rescheduled successfully")
      setRescheduleId(null)
      setNewScheduleDate("")
      setNewScheduleTime("")
      fetchDashboardData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reschedule appointment")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      SCHEDULED: { variant: "default", label: "Scheduled" },
      CONFIRMED: { variant: "default", label: "Confirmed" },
      CHECKED_IN: { variant: "secondary", label: "Checked In" },
      IN_PROGRESS: { variant: "secondary", label: "In Progress" },
      COMPLETED: { variant: "outline", label: "Completed" },
      CANCELLED: { variant: "destructive", label: "Cancelled" },
      RESCHEDULED: { variant: "secondary", label: "Rescheduled" },
    }
    const config = statusMap[status] || { variant: "outline", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="queue">Patient Queue</TabsTrigger>
          <TabsTrigger value="today">Today's Schedule</TabsTrigger>
          <TabsTrigger value="all">All Appointments</TabsTrigger>
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
                      className={`transition-all hover:shadow-md ${entry.priority === "urgent" ? "border-red-300 bg-red-50/50" : ""}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                              entry.status === "completed" ? "bg-green-100 text-green-700" :
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
                                <Badge variant={entry.status === "completed" ? "default" : "outline"} className="text-xs">
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
                              <Button size="sm" onClick={() => handleQueueUpdate(entry.id, "checked_in")}>
                                Check In
                              </Button>
                            )}
                            {entry.status === "checked_in" && (
                              <Button size="sm" variant="default" onClick={() => handleQueueUpdate(entry.id, "in_progress")}>
                                Start Consultation
                              </Button>
                            )}
                            {entry.status === "in_progress" && (
                              <Button size="sm" variant="outline" onClick={() => handleQueueUpdate(entry.id, "completed")}>
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
        <TabsContent value="today" className="space-y-4">
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
                      <TableHead>Doctor</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayAppointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell className="font-medium">
                          {format(new Date(apt.scheduledAt), "h:mm a")}
                        </TableCell>
                        <TableCell>
                          {apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : apt.patientName || "N/A"}
                        </TableCell>
                        <TableCell>
                          {apt.doctor ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}` : "N/A"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{apt.reason || "General"}</TableCell>
                        <TableCell>
                          {apt.patient?.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {apt.patient.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(apt.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(apt.status === "SCHEDULED" || apt.status === "CONFIRMED") && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => handleCheckIn(apt.id)}>
                                  Check In
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setRescheduleId(apt.id)
                                    setNewScheduleDate(format(new Date(apt.scheduledAt), "yyyy-MM-dd"))
                                    setNewScheduleTime(format(new Date(apt.scheduledAt), "HH:mm"))
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => setCancelId(apt.id)}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
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

        {/* All Appointments Tab */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Clinic Appointments</CardTitle>
                  <CardDescription>View and manage all appointments for your clinic</CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {allAppointments.length} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {allAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No appointments found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {allAppointments.map((apt) => (
                    <Card key={apt.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold">
                                {apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : apt.patientName || "N/A"}
                              </p>
                              {getStatusBadge(apt.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(apt.scheduledAt), "MMM d, yyyy")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(apt.scheduledAt), "h:mm a")}
                              </div>
                              <div className="col-span-2">
                                Dr. {apt.doctor ? `${apt.doctor.firstName} ${apt.doctor.lastName}` : "N/A"}
                              </div>
                              {apt.reason && (
                                <div className="col-span-2">Reason: {apt.reason}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {(apt.status === "SCHEDULED" || apt.status === "CONFIRMED") && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setRescheduleId(apt.id)
                                    setNewScheduleDate(format(new Date(apt.scheduledAt), "yyyy-MM-dd"))
                                    setNewScheduleTime(format(new Date(apt.scheduledAt), "HH:mm"))
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => setCancelId(apt.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/appointments/${apt.id}`}>View</Link>
                            </Button>
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
                  <Link href="/appointments/list">
                    <Calendar className="mr-2 h-4 w-4" />
                    All Appointments
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

      {/* Cancel Appointment Dialog */}
      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? The patient will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelAppointment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Cancel It
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule Appointment Dialog */}
      <Dialog open={!!rescheduleId} onOpenChange={(open) => !open && setRescheduleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for this appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newDate">New Date</Label>
              <Input
                id="newDate"
                type="date"
                value={newScheduleDate}
                onChange={(e) => setNewScheduleDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newTime">New Time</Label>
              <Input
                id="newTime"
                type="time"
                value={newScheduleTime}
                onChange={(e) => setNewScheduleTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleId(null)}>Cancel</Button>
            <Button onClick={handleRescheduleAppointment}>Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
