"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, Plus, User, Phone, Loader2 } from "lucide-react"
import { apiService } from "@/services/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { useAppSelector } from "@/app/hooks"

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

export default function AppointmentsListPage() {
  const router = useRouter()
  const { user } = useAppSelector((state) => state.auth)
  const role = user?.role?.toLowerCase()
  const isDoctor = role === "doctor"
  const isReceptionist = role === "receptionist"
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")
  const [cancelId, setCancelId] = useState<string | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response: any = await apiService.get("/appointments")
      // apiService unwraps the response, so data could be in response directly or response.appointments
      const appointmentsList = response?.appointments || response?.data?.appointments || response?.data || response || []
      setAppointments(Array.isArray(appointmentsList) ? appointmentsList : [])
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
      toast.error("Failed to load appointments")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelId) return
    try {
      await apiService.post(`/appointments/${cancelId}/cancel`, { reason: "Patient requested cancellation" })
      toast.success("Appointment cancelled successfully")
      fetchAppointments()
    } catch (error: any) {
      console.error("Failed to cancel appointment:", error)
      toast.error(error.message || "Failed to cancel appointment")
    } finally {
      setCancelId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      SCHEDULED: { variant: "default", label: "Scheduled" },
      CONFIRMED: { variant: "default", label: "Confirmed" },
      RESCHEDULED: { variant: "default", label: "Rescheduled" },
      COMPLETED: { variant: "secondary", label: "Completed" },
      CANCELLED: { variant: "destructive", label: "Cancelled" },
      NO_SHOW: { variant: "outline", label: "No Show" },
      CHECKED_IN: { variant: "default", label: "Checked In" },
      IN_PROGRESS: { variant: "default", label: "In Progress" }
    }

    const config = statusConfig[status] || { variant: "outline", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filterAppointments = (status: string) => {
    const scheduledAt = (apt: any) => new Date(apt.scheduledAt || apt.appointmentDate)
    if (status === "upcoming") {
      return appointments.filter(apt => {
        const isUpcomingStatus = ["SCHEDULED", "CONFIRMED", "RESCHEDULED", "CHECKED_IN", "IN_PROGRESS"].includes(apt.status)
        const isFuture = scheduledAt(apt) >= new Date()
        return isUpcomingStatus && (apt.status === "IN_PROGRESS" || isFuture)
      })
    } else if (status === "past") {
      return appointments.filter(apt =>
        apt.status === "COMPLETED" || apt.status === "NO_SHOW" ||
        (scheduledAt(apt) < new Date() && apt.status !== "CANCELLED" && !["SCHEDULED", "CONFIRMED", "RESCHEDULED", "CHECKED_IN"].includes(apt.status))
      )
    } else if (status === "cancelled") {
      return appointments.filter(apt => apt.status === "CANCELLED")
    }
    return appointments
  }

  const canCancelAppointment = (apt: any) => {
    const upcomingStatuses = ["SCHEDULED", "CONFIRMED", "RESCHEDULED", "CHECKED_IN"]
    const isUpcoming = upcomingStatuses.includes(apt.status) && new Date(apt.scheduledAt || apt.appointmentDate) >= new Date()
    return isUpcoming
  }

  const filteredAppointments = filterAppointments(activeTab)

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isDoctor ? "Patient Appointments" : isReceptionist ? "Clinic Appointments" : "My Appointments"}
          </h1>
          <p className="text-muted-foreground">View and manage all appointments</p>
        </div>
        {(!isDoctor || isReceptionist) && (
          <Button onClick={() => router.push("/appointments/create")} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            {isReceptionist ? "Create Appointment" : "Book New Appointment"}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({filterAppointments("upcoming").length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Previous / Completed ({filterAppointments("past").length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({filterAppointments("cancelled").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">No {activeTab} appointments</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  {activeTab === "upcoming"
                    ? (isDoctor ? "No upcoming appointments." : "You don't have any upcoming appointments.")
                    : `You don't have any ${activeTab} appointments.`
                  }
                </p>
                {(!isDoctor || isReceptionist) && activeTab === "upcoming" && (
                  <Button onClick={() => router.push("/appointments/create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    {isReceptionist ? "Create Appointment" : "Book Appointment"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAppointments.map((appointment) => (
                <Card
                  key={appointment.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/appointments/${appointment.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">
                          {isDoctor
                            ? (appointment.patient?.firstName ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : (appointment.patientName || `Patient #${appointment.patientId}`))
                            : `Dr. ${appointment.doctor?.firstName} ${appointment.doctor?.lastName}`
                          }
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          {isDoctor ? (
                            <>
                              <Phone className="h-3 w-3" />
                              {appointment.patient?.phone || appointment.patientPhone || "No phone"}
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3" />
                              {appointment.doctor?.specialization || "General Physician"}
                            </>
                          )}
                        </CardDescription>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(appointment.scheduledAt || appointment.appointmentDate), "EEEE, MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.time || (appointment.scheduledAt ? format(new Date(appointment.scheduledAt), "h:mm a") : "Not specified")}</span>
                      </div>
                      {appointment.clinic && (
                        <div className="flex items-center gap-2 text-sm md:col-span-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.clinic.name}, {appointment.clinic.address}</span>
                        </div>
                      )}
                      {appointment.reason && (
                        <div className="md:col-span-2 text-sm text-muted-foreground">
                          <strong>Reason:</strong> {appointment.reason}
                        </div>
                      )}
                    </div>

                    {canCancelAppointment(appointment) && (
                      <div className="flex gap-2 pt-2">
                        {!isDoctor && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/appointments/${appointment.id}/reschedule`)
                            }}
                          >
                            Reschedule
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCancelId(appointment.id)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Cancel It
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
