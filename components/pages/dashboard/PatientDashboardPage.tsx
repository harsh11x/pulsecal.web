"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Stethoscope, FileText, Clock, User, Plus, Heart, Activity, Building2, IndianRupee, Search } from "lucide-react"
import Link from "next/link"
import { PatientBookFlow } from "@/components/appointments/PatientBookFlow"
import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { toast } from "sonner"
import { socketService } from "@/services/socket"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PatientDashboardPageProps {
  user: any
}

interface Appointment {
  id: string
  doctor?: { firstName: string; lastName: string; specialization?: string }
  scheduledAt: string
  status: string
  reason?: string
  clinic?: { name: string; address: string; city: string }
}

interface Prescription {
  id: string
  medication?: string
  medicationName?: string
  dosage?: string
  frequency?: string
  status: string
  prescribedAt: string
  doctor?: { firstName: string; lastName: string }
}

export default function PatientDashboardPage({ user }: PatientDashboardPageProps) {
  const [statsData, setStatsData] = useState({
    upcomingAppointments: 0,
    activePrescriptions: 0,
    medicalRecords: 0
  })
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [activePrescriptions, setActivePrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userCity, setUserCity] = useState<string | null>(null)
  const [nearbyClinics, setNearbyClinics] = useState<any[]>([])
  const [nearbyDoctors, setNearbyDoctors] = useState<any[]>([])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => { }
      )
    }
  }, [])

  // Reverse geocode to get city for extra filtering
  useEffect(() => {
    if (!userLocation) return
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${userLocation.lat}&lon=${userLocation.lng}&format=json`,
      { headers: { Accept: "application/json" } }
    )
      .then((r) => r.json())
      .then((data) => {
        const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county
        if (city) setUserCity(city)
      })
      .catch(() => { })
  }, [userLocation])

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  useEffect(() => {
    if (!userLocation) return
    const params = new URLSearchParams({
      latitude: String(userLocation.lat),
      longitude: String(userLocation.lng),
      radius: "10",
      limit: "15",
    })
    if (userCity) params.set("city", userCity)
    apiService.get(`/clinics?${params}`).then((r: any) => {
      const list = Array.isArray(r) ? r : (r?.clinics ?? r?.data ?? [])
      setNearbyClinics(list)
    }).catch(() => { })
    apiService.get(`/doctors/search?${params}&limit=15`).then((r: any) => {
      const list = Array.isArray(r) ? r : (r?.doctors ?? r?.data ?? [])
      setNearbyDoctors(list)
    }).catch(() => { })
  }, [userLocation, userCity])

  useEffect(() => {
    // Socket connection for real-time updates
    const connectSocket = async () => {
      await socketService.connect()

      socketService.on("appointment:new", (data: any) => {
        toast.success("New appointment booked!")
        fetchDashboardData()
      })

      socketService.on("appointment:update", (data: any) => {
        toast.info("Appointment updated")
        fetchDashboardData()
      })
    }

    connectSocket()

    return () => {
      socketService.off("appointment:new")
      socketService.off("appointment:update")
    }
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    let appointments: Appointment[] = []
    let prescriptions: Prescription[] = []

    try {
      // Fetch upcoming appointments (independent - don't fail entire dashboard if this fails)
      try {
        const appointmentsResponse: any = await apiService.get("/appointments")
        const raw = appointmentsResponse
        const allAppointments = Array.isArray(raw) ? raw : raw?.appointments || []
        appointments = allAppointments
          .filter((apt: Appointment) =>
            ["SCHEDULED", "CONFIRMED", "CHECKED_IN"].includes(apt.status) &&
            new Date(apt.scheduledAt) >= new Date()
          )
          .sort((a: Appointment, b: Appointment) =>
            new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          )
          .slice(0, 5)
        setUpcomingAppointments(appointments)
      } catch (aptErr: any) {
        console.warn("Failed to fetch appointments:", aptErr?.message)
        setUpcomingAppointments([])
      }

      // Fetch active prescriptions (independent)
      try {
        const prescriptionsResponse: any = await apiService.get("/prescriptions")
        const raw = prescriptionsResponse
        const allRx = Array.isArray(raw) ? raw : raw?.prescriptions || raw?.data || []
        prescriptions = (Array.isArray(allRx) ? allRx : []).slice(0, 5)
        setActivePrescriptions(prescriptions)
      } catch (rxErr: any) {
        console.warn("Failed to fetch prescriptions:", rxErr?.message)
        setActivePrescriptions([])
      }

      // Compute stats from fetched data (no /patients/stats endpoint needed)
      setStatsData({
        upcomingAppointments: appointments.length,
        activePrescriptions: prescriptions.length,
        medicalRecords: 0, // Would need medical-records API if needed
      })
    } catch (error: any) {
      console.error("Dashboard data error:", error)
      setStatsData({ upcomingAppointments: 0, activePrescriptions: 0, medicalRecords: 0 })
      toast.error("Some data couldn't be loaded. You can still use the dashboard.")
    } finally {
      setLoading(false)
    }
  }

  const safeFormatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—"
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? "—" : format(d, "MMM d, yyyy")
    } catch { return "—" }
  }
  const safeFormatTime = (dateStr: string | undefined) => {
    if (!dateStr) return "—"
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? "—" : format(d, "h:mm a")
    } catch { return "—" }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      SCHEDULED: { variant: "default", label: "Scheduled" },
      CONFIRMED: { variant: "default", label: "Confirmed" },
      CHECKED_IN: { variant: "secondary", label: "Checked In" },
      IN_PROGRESS: { variant: "secondary", label: "In Progress" },
      COMPLETED: { variant: "outline", label: "Completed" },
      CANCELLED: { variant: "destructive", label: "Cancelled" },
    }
    const config = statusMap[status] || { variant: "outline", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

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
    {
      title: "Medical Records",
      value: statsData.medicalRecords,
      trend: { value: 0, label: "Documents available", isPositive: true },
      icon: FileText,
      color: "purple" as const,
      description: "Your health records",
    },
    {
      title: "Health Score",
      value: "Good",
      trend: { value: 0, label: "Based on recent visits", isPositive: true },
      icon: Heart,
      color: "purple" as const,
      description: "Overall health status",
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
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {user?.firstName}!</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Here&apos;s what&apos;s happening with your health</p>
        </div>
        <Button asChild size="default" className="w-full sm:w-auto">
          <Link href="/appointments/create">
            <Plus className="mr-2 h-4 w-4" />
            Book Appointment
          </Link>
        </Button>
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
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 p-1 h-auto">
          <TabsTrigger value="appointments" className="text-xs sm:text-sm px-2">Appointments</TabsTrigger>
          <TabsTrigger value="nearby" className="text-xs sm:text-sm px-2">Nearby</TabsTrigger>
          <TabsTrigger value="prescriptions" className="text-xs sm:text-sm px-2">Prescriptions</TabsTrigger>
          <TabsTrigger value="doctors" className="text-xs sm:text-sm px-2">Find Doctors</TabsTrigger>
        </TabsList>

        {/* Nearby Clinics & Doctors Tab */}
        <TabsContent value="nearby" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Nearby (10 km)
              </CardTitle>
              <CardDescription>
                Clinics and doctors in your area. Enable location to see results.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!userLocation ? (
                <p className="text-center py-8 text-muted-foreground">
                  Enable location access to see nearby clinics and doctors.
                </p>
              ) : (
                <>
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Clinics
                    </h3>
                    {nearbyClinics.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4">No clinics found nearby.</p>
                    ) : (
                      <div className="space-y-2">
                        {nearbyClinics.map((c: any) => (
                          <Card key={c.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                <div>
                                  <Link href={`/clinic/${c.id}`} className="font-semibold hover:underline">
                                    {c.name}
                                  </Link>
                                  <p className="text-sm text-muted-foreground">{c.address}, {c.city}</p>
                                  {c.distance != null && (
                                    <p className="text-xs text-muted-foreground">{c.distance} km away</p>
                                  )}
                                </div>
                                <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                                  <Link href={`/clinic/${c.id}`}>View doctors</Link>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Doctors
                    </h3>
                    {nearbyDoctors.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4">No doctors found nearby.</p>
                    ) : (
                      <div className="space-y-2">
                        {nearbyDoctors.map((d: any) => {
                          const docId = d.user?.id ?? d.id
                          return (
                            <Card key={docId} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-semibold">
                                      Dr. {d.user?.firstName ?? d.firstName} {d.user?.lastName ?? d.lastName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{d.specialization} · {d.clinicName || "Clinic"}</p>
                                    {d.distance != null && (
                                      <p className="text-xs text-muted-foreground">{d.distance} km away</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium flex items-center gap-0.5">
                                      <IndianRupee className="h-3 w-3" />
                                      {Number(d.consultationFee || 0)}
                                    </span>
                                    <Button asChild size="sm">
                                      <Link href={`/doctors/${docId}/book`}>Book</Link>
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/appointments/create">
                      <Search className="mr-2 h-4 w-4" />
                      Search by symptom (fever, cough, etc.)
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>Your scheduled visits with doctors</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/appointments/list">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                  <Button asChild>
                    <Link href="/appointments/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Book Your First Appointment
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <Card key={apt.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold">
                                  Dr. {apt.doctor ? `${apt.doctor.firstName} ${apt.doctor.lastName}` : "N/A"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {apt.doctor?.specialization || "General Physician"}
                                </p>
                              </div>
                              {getStatusBadge(apt.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {safeFormatDate(apt.scheduledAt)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {safeFormatTime(apt.scheduledAt)}
                              </div>
                              {apt.clinic && (
                                <div className="col-span-2 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {apt.clinic.name}, {apt.clinic.city}
                                </div>
                              )}
                              {apt.reason && (
                                <div className="col-span-2">Reason: {apt.reason}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/appointments/${apt.id}`}>View Details</Link>
                            </Button>
                            {apt.status === "SCHEDULED" && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/appointments/${apt.id}/reschedule`}>Reschedule</Link>
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

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your healthcare</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full justify-start">
                  <Link href="/appointments/create">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book New Appointment
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/appointments/list">
                    <Calendar className="mr-2 h-4 w-4" />
                    View All Appointments
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/health/medical-records">
                    <FileText className="mr-2 h-4 w-4" />
                    Medical Records
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/health/prescriptions">
                    <Stethoscope className="mr-2 h-4 w-4" />
                    My Prescriptions
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Health Tips</CardTitle>
                <CardDescription>Daily wellness reminders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Stay Hydrated</p>
                    <p className="text-xs text-muted-foreground">Drink at least 8 glasses of water daily</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <Heart className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Regular Exercise</p>
                    <p className="text-xs text-muted-foreground">30 minutes of activity keeps you healthy</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <Stethoscope className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Regular Checkups</p>
                    <p className="text-xs text-muted-foreground">Schedule annual health screenings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Active Prescriptions Tab */}
        <TabsContent value="prescriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Prescriptions</CardTitle>
                  <CardDescription>Your current medications</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/health/prescriptions">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activePrescriptions.length === 0 ? (
                <div className="text-center py-12">
                  <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active prescriptions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activePrescriptions.map((prescription) => (
                    <Card key={prescription.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Stethoscope className="h-4 w-4 text-primary" />
                              <p className="font-semibold">{prescription.medication || prescription.medicationName || "Prescription"}</p>
                              <Badge variant="default" className="text-xs">Active</Badge>
                            </div>
                            {prescription.dosage && (
                              <p className="text-sm text-muted-foreground">Dosage: {prescription.dosage}</p>
                            )}
                            {prescription.frequency && (
                              <p className="text-sm text-muted-foreground">Frequency: {prescription.frequency}</p>
                            )}
                            {prescription.doctor && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Prescribed by Dr. {prescription.doctor.firstName} {prescription.doctor.lastName}
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/health/prescriptions/${prescription.id}`}>View</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Find Doctors Tab */}
        <TabsContent value="doctors" className="space-y-4 mt-0">
          <PatientBookFlow />
        </TabsContent>
      </Tabs>
    </div>
  )
}
