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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  doctor?: { id?: string; firstName: string; lastName: string }
  doctorId?: string
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

  const [clinicDoctors, setClinicDoctors] = useState<{ id: string; firstName: string; lastName: string; doctorProfile?: { specialization?: string; consultationFee?: number } }[]>([])
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>("all")
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
      // Fetch receptionist stats (clinic-scoped) - single source for counts
      const statsResponse: any = await apiService.get("/receptionists/stats")
      if (statsResponse?.stats) {
        const s = statsResponse.stats
        setTodayStats({
          appointments: s.appointments ?? s.totalBooked ?? 0,
          completed: s.completed ?? 0,
          waiting: s.waiting ?? 0,
          cancelled: s.cancelled ?? 0,
          inProgress: s.inProgress ?? 0,
        })
      } else {
        setTodayStats({ appointments: 0, completed: 0, waiting: 0, cancelled: 0, inProgress: 0 })
      }

      if (statsResponse?.clinic) {
        setClinicInfo(statsResponse.clinic)
      }

      // Fetch queue (clinic-scoped by backend using user's clinicId)
      const queueResponse: any = await apiService.get("/receptionists/queue")
      const rawQueue = Array.isArray(queueResponse) ? queueResponse : []
      const mapped = rawQueue.map((e: any) => ({
        ...e,
        patientName: e.patientName ?? (e.patient ? `${e.patient.firstName || ''} ${e.patient.lastName || ''}`.trim() : 'Unknown'),
        phone: e.phone ?? e.patient?.phone,
        reason: e.reason ?? 'Consultation',
      }))
      setQueue(mapped)

      // Fetch today's appointments (clinic-scoped by backend)
      const todayResponse: any = await apiService.get("/appointments?date=today")
      const todayApts = todayResponse?.appointments ?? todayResponse
      setTodayAppointments(Array.isArray(todayApts) ? todayApts : [])

      // Fetch all appointments for the clinic (clinic-scoped, paginated)
      const allResponse: any = await apiService.get("/appointments?limit=500")
      const allApts = allResponse?.appointments ?? allResponse
      setAllAppointments(Array.isArray(allApts) ? allApts : [])

      // Fetch clinic doctors
      const doctorsResponse: any = await apiService.get("/receptionists/doctors")
      const docs = Array.isArray(doctorsResponse) ? doctorsResponse : (doctorsResponse?.doctors ?? doctorsResponse?.data ?? [])
      setClinicDoctors(docs)
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
      await apiService.post(`/appointments/${appointmentId}/checkin`)
      toast.success("Patient checked in successfully")
      fetchDashboardData()
    } catch (error: any) {
      toast.error(error.message || "Failed to check in patient")
    }
  }

  const handleAcceptAppointment = async (appointmentId: string) => {
    try {
      await apiService.put(`/appointments/${appointmentId}`, {
        status: "CONFIRMED"
      })
      toast.success("Appointment accepted successfully")
      fetchDashboardData()
    } catch (error: any) {
      toast.error(error.message || "Failed to accept appointment")
    }
  }

  const handleQueueUpdate = async (queueId: string, status: string) => {
    try {
      await apiService.put(`/queue/${queueId}`, { status })
      toast.success("Queue updated")
      fetchDashboardData()
    } catch (error: any) {
      toast.error(error.message || "Failed to update queue")
    }
  }

  const handleCancelAppointment = async () => {
    if (!cancelId) return
    try {
      await apiService.post(`/appointments/${cancelId}/cancel`, {
        cancellationReason: "Cancelled by receptionist"
      })
      toast.success("Appointment cancelled successfully")
      setCancelId(null)
      fetchDashboardData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel appointment")
    }
  }

  const handleMarkCompleted = async (appointmentId: string) => {
    try {
      await apiService.put(`/appointments/${appointmentId}`, {
        status: "COMPLETED"
      })
      toast.success("Appointment marked as completed")
      fetchDashboardData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark as completed")
    }
  }

  const handleRescheduleAppointment = async () => {
    if (!rescheduleId || !newScheduleDate || !newScheduleTime) {
      toast.error("Please select both date and time")
      return
    }

    try {
      const scheduledAt = new Date(`${newScheduleDate}T${newScheduleTime}`)
      await apiService.post(`/appointments/${rescheduleId}/reschedule`, {
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

  const filterByDoctor = (apt: Appointment) => {
    if (selectedDoctorFilter === "all") return true
    const doctorId = (apt as any).doctorId ?? (apt.doctor as any)?.id
    return doctorId === selectedDoctorFilter
  }

  const filteredTodayAppointments = todayAppointments.filter(filterByDoctor)
  const filteredAllAppointments = allAppointments.filter(filterByDoctor)

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
      title: "Pending & Waiting",
      value: todayStats.waiting,
      trend: {
        value: 0,
        label: "In queue or pending",
        isPositive: false
      },
      icon: Clock,
      color: "orange" as const,
      description: "Patients waiting or pending",
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
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden px-2 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold">Receptionist Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName}! Manage your clinic operations</p>
          {clinicInfo?.name && (
            <p className="mt-1 flex items-center gap-1 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              {clinicInfo.name}
            </p>
          )}
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-2 w-full sm:w-auto">
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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 p-1 h-auto">
          <TabsTrigger value="queue" className="text-xs sm:text-sm px-2">Patient Queue</TabsTrigger>
          <TabsTrigger value="today" className="text-xs sm:text-sm px-2">Today&apos;s Schedule</TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm px-2">All Appointments</TabsTrigger>
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2">Overview</TabsTrigger>
        </TabsList>

        {/* Queue Management Tab */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <CardTitle>Patient Queue</CardTitle>
                  <CardDescription>Manage patients waiting to see the doctor</CardDescription>
                </div>
                <Badge variant="outline" className="text-base sm:text-lg px-2 sm:px-3 py-1 w-fit">
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
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0 ${entry.status === "completed" ? "bg-green-100 text-green-700" :
                              entry.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                                entry.status === "checked_in" ? "bg-purple-100 text-purple-700" :
                                  "bg-orange-100 text-orange-700"
                              }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                                <p className="font-semibold text-base sm:text-lg truncate">{entry.patientName}</p>
                                {entry.priority === "urgent" && (
                                  <Badge variant="destructive" className="text-xs">Urgent</Badge>
                                )}
                                <Badge variant={entry.status === "completed" ? "default" : "outline"} className="text-xs w-fit">
                                  {entry.status.replace("_", " ").toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1 line-clamp-2">{entry.reason}</p>
                              {entry.appointmentTime && (
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                    {entry.appointmentTime}
                                  </span>
                                  {entry.phone && (
                                    <span className="flex items-center gap-1 truncate">
                                      <Phone className="h-3 w-3 flex-shrink-0" />
                                      {entry.phone}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
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
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div className="min-w-0">
                <CardTitle>Today&apos;s Appointments</CardTitle>
                <CardDescription>Manage scheduled appointments for today</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                {clinicDoctors.length > 0 && (
                  <Select value={selectedDoctorFilter} onValueChange={setSelectedDoctorFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="All doctors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All doctors</SelectItem>
                      {clinicDoctors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          Dr. {d.firstName} {d.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Badge variant="outline" className="text-base sm:text-lg px-2 sm:px-3 py-1 w-fit">
                  {filteredTodayAppointments.length} of {todayAppointments.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTodayAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {todayAppointments.length === 0 ? "No appointments scheduled for today" : "No appointments for selected doctor"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0 min-w-0">
                  <Table className="min-w-[600px]">
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
                      {filteredTodayAppointments.map((apt) => (
                        <TableRow key={apt.id} className="align-top">
                          <TableCell className="font-medium whitespace-nowrap text-xs sm:text-sm py-2">
                            {(() => {
                              try {
                                const date = new Date(apt.scheduledAt)
                                // Check if date is valid
                                if (isNaN(date.getTime())) return "Invalid Time"
                                return format(date, "h:mm a")
                              } catch (e) {
                                return "Invalid Time"
                              }
                            })()}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm py-2">
                            {apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : apt.patientName || "N/A"}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm py-2">
                            {apt.doctor ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={(apt.doctor as any).profileImage} alt={`Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`} />
                                  <AvatarFallback>
                                    {`Dr. ${apt.doctor.firstName}`.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{`Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`}</span>
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs sm:text-sm py-2 max-w-[80px] truncate">{apt.reason || "General"}</TableCell>
                          <TableCell className="py-2">
                            {apt.patient?.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {apt.patient.phone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2">{getStatusBadge(apt.status)}</TableCell>
                          <TableCell className="text-right py-2">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              {(apt.status === "PENDING" || apt.status === "REQUESTED") && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleAcceptAppointment(apt.id)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" /> Accept
                                </Button>
                              )}
                              {(apt.status === "SCHEDULED" || apt.status === "CONFIRMED" || apt.status === "IN_PROGRESS") && (
                                <>
                                  {apt.status !== "IN_PROGRESS" && (
                                    <Button size="sm" variant="ghost" onClick={() => handleCheckIn(apt.id)}>
                                      Check In
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleMarkCompleted(apt.id)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" /> Complete
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Appointments Tab */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <CardTitle>All Clinic Appointments</CardTitle>
                  <CardDescription>View and manage all appointments for your clinic</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  {clinicDoctors.length > 0 && (
                    <Select value={selectedDoctorFilter} onValueChange={setSelectedDoctorFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="All doctors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All doctors</SelectItem>
                        {clinicDoctors.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            Dr. {d.firstName} {d.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Badge variant="outline" className="text-base sm:text-lg px-2 sm:px-3 py-1 w-fit">
                    {filteredAllAppointments.length} of {allAppointments.length}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAllAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {allAppointments.length === 0 ? "No appointments found" : "No appointments for selected doctor"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredAllAppointments.map((apt) => (
                    <Card key={apt.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold">
                                {apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : apt.patientName || "N/A"}
                              </p>
                              {getStatusBadge(apt.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
                          <div className="flex flex-wrap items-center gap-1 flex-shrink-0">
                            {(apt.status === "PENDING" || apt.status === "REQUESTED") && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleAcceptAppointment(apt.id)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" /> Accept
                              </Button>
                            )}
                            {(apt.status === "SCHEDULED" || apt.status === "CONFIRMED" || apt.status === "IN_PROGRESS") && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleMarkCompleted(apt.id)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" /> Complete
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

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Clinic Doctors</CardTitle>
                  <CardDescription>Doctors at your clinic – select when booking</CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link href="/appointments/create">
                    <Plus className="mr-1 h-4 w-4" />
                    Book
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {clinicDoctors.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No doctors at this clinic</p>
                ) : (
                  <ScrollArea className="h-[200px] rounded-md border p-2">
                    <div className="space-y-2 pr-4">
                      {clinicDoctors.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div>
                            <p className="font-medium">Dr. {d.firstName} {d.lastName}</p>
                            {d.doctorProfile?.specialization && (
                              <p className="text-xs text-muted-foreground">{d.doctorProfile.specialization}</p>
                            )}
                          </div>
                          <div className="text-right">
                            {d.doctorProfile?.consultationFee != null && (
                              <p className="text-sm font-medium">₹{d.doctorProfile.consultationFee}</p>
                            )}
                            <Button asChild variant="ghost" size="sm" className="mt-1">
                              <Link href={`/appointments/create?doctor=${d.id}`}>Book</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Summary</CardTitle>
              <CardDescription>Quick overview of today&apos;s operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
                <div className="text-center p-3 sm:p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">{todayStats.appointments}</p>
                  <p className="text-sm text-muted-foreground">Total Appointments</p>
                </div>
                <div className="text-center p-3 sm:p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{todayStats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="text-center p-3 sm:p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{todayStats.waiting}</p>
                  <p className="text-sm text-muted-foreground">Waiting</p>
                </div>
                <div className="text-center p-3 sm:p-4 border rounded-lg">
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
