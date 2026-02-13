"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Stethoscope, FileText, Clock, User, Plus, Heart, Activity, Building2, IndianRupee, Search } from "lucide-react"
import Link from "next/link"
import { DoctorDiscoveryMap } from "@/components/doctors/DoctorDiscoveryMap"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy-deep">Good Morning, {user?.firstName}</h1>
          <p className="text-corporate-gray mt-1">Here&apos;s your health overview for today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white border-slate-200 text-navy-deep hover:bg-slate-50 shadow-sm gap-2">
            <Activity className="h-4 w-4" />
            Download Records
          </Button>
          <Button className="bg-medical-blue hover:bg-blue-700 text-white shadow-md gap-2" asChild>
            <Link href="/appointments/create">
              <Plus className="h-5 w-5" />
              Book New Appointment
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area (2/3) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Featured Appointment Card */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden dashboard-card">
            {upcomingAppointments.length > 0 ? (
              <>
                <div className="bg-gradient-to-r from-medical-blue to-blue-600 p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 opacity-90">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Next Appointment</span>
                    </div>
                    <h2 className="text-2xl font-bold">{upcomingAppointments[0].reason || "Consultation"}</h2>
                    <p className="text-blue-100 text-sm mt-1">
                      with Dr. {upcomingAppointments[0].doctor?.firstName} {upcomingAppointments[0].doctor?.lastName} • {upcomingAppointments[0].doctor?.specialization || "General"}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 text-center min-w-[100px] border border-white/20">
                    <div className="text-xs uppercase opacity-80 mb-1">On</div>
                    <div className="text-xl font-bold font-mono">
                      {new Date(upcomingAppointments[0].scheduledAt).getDate()}
                      <span className="text-sm font-normal ml-1">
                        {format(new Date(upcomingAppointments[0].scheduledAt), "MMM")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex flex-col sm:flex-row gap-6 justify-between items-center">
                  <div className="flex gap-6 w-full">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-medical-blue">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-medium uppercase">Time</div>
                        <div className="text-sm font-bold text-navy-deep">{format(new Date(upcomingAppointments[0].scheduledAt), "h:mm a")}</div>
                      </div>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-medical-blue">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-medium uppercase">Location</div>
                        <div className="text-sm font-bold text-navy-deep">{upcomingAppointments[0].clinic?.name || "Main Clinic"}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" className="flex-1 sm:flex-none text-red-600 bg-red-50 hover:bg-red-100 border-none">Reschedule</Button>
                    <Button variant="ghost" className="flex-1 sm:flex-none text-medical-blue bg-blue-50 hover:bg-blue-100 border-none">Details</Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center bg-slate-50">
                <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-navy-deep">No Upcoming Appointments</h3>
                <p className="text-slate-500 mb-4">You have no appointments scheduled.</p>
                <Button asChild>
                  <Link href="/appointments/create">Book Now</Link>
                </Button>
              </div>
            )}
          </section>

          {/* Quick Actions Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/health/medical-records" className="block">
              <div className="dashboard-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer group h-full">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-deep mb-2">Medical Records</h3>
                <p className="text-sm text-slate-500 mb-4">Access your lab results, imaging, and visit summaries.</p>
                <div className="flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 mt-auto">
                  View Latest Results
                </div>
              </div>
            </Link>

            <Link href="/health/prescriptions" className="block">
              <div className="dashboard-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer group h-full">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-deep mb-2">Prescriptions</h3>
                <p className="text-sm text-slate-500 mb-4">Request renewals and view active medications.</p>
                <div className="flex items-center text-sm font-semibold text-emerald-600 group-hover:text-emerald-700 mt-auto">
                  {activePrescriptions.length} Active Rx
                </div>
              </div>
            </Link>

            <Link href="/chat" className="block">
              <div className="dashboard-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer group h-full">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-deep mb-2">Message Doctor</h3>
                <p className="text-sm text-slate-500 mb-4">Secure communication with your care team.</p>
                <div className="flex items-center text-sm font-semibold text-orange-600 group-hover:text-orange-700 mt-auto">
                  Start New Thread
                </div>
              </div>
            </Link>
          </section>

          {/* Health Trends (Mock Visual) */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-navy-deep">Health Trends</h3>
                <p className="text-sm text-slate-500">Blood Pressure Monitoring (Last 30 Days)</p>
              </div>
              <select className="text-sm border-slate-200 rounded-lg text-slate-600 focus:border-medical-blue focus:ring-medical-blue py-1.5 px-3 bg-slate-50">
                <option>Blood Pressure</option>
                <option>Heart Rate</option>
                <option>Weight</option>
              </select>
            </div>
            {/* Simple CSS-based bar chart representation */}
            <div className="relative h-64 w-full flex items-end gap-2 md:gap-4 pb-8 border-b border-slate-100">
              <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-slate-400">
                <span>140</span><span>120</span><span>100</span><span>80</span><span>60</span>
              </div>
              <div className="flex-1 flex items-end justify-between ml-10 h-full relative z-10 w-full">
                {/* Grid Lines */}
                <div className="absolute w-full h-full pointer-events-none flex flex-col justify-between z-0">
                  {[...Array(5)].map((_, i) => <div key={i} className="w-full border-t border-slate-100 border-dashed"></div>)}
                </div>
                {/* Bars */}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const h1 = [60, 65, 58, 62, 68, 60, 63][i];
                  const h2 = [40, 42, 38, 40, 45, 41, 39][i];
                  return (
                    <div key={day} className="group relative flex flex-col items-center justify-end h-full w-full z-10">
                      <div style={{ height: `${h1}%` }} className="w-3 md:w-6 bg-blue-200 rounded-t-sm group-hover:bg-medical-blue transition-colors"></div>
                      <div style={{ height: `${h2}%`, marginTop: `-${h2}%` }} className="w-3 md:w-6 bg-slate-200 rounded-t-sm group-hover:bg-slate-300 transition-colors"></div>
                      <span className="text-[10px] text-slate-400 mt-2 absolute -bottom-6">{day}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Original Tabs Content (Preserved but lower priority) */}
          <Tabs defaultValue="nearby" className="space-y-4">
            <TabsList>
              <TabsTrigger value="nearby">Nearby Clinics</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="nearby">
              <DoctorDiscoveryMap />
            </TabsContent>
          </Tabs>

        </div>

        {/* Sidebar Content (1/3) */}
        <aside className="space-y-6">
          {/* Physician Profile Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                {upcomingAppointments[0]?.doctor?.firstName ? (
                  <div className="w-full h-full bg-medical-blue text-white flex items-center justify-center text-xl font-bold">
                    {upcomingAppointments[0].doctor.firstName[0]}
                  </div>
                ) : (
                  <User className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <div>
                <div className="text-sm text-slate-500">Primary Care Physician</div>
                <div className="font-bold text-navy-deep">
                  {upcomingAppointments[0]?.doctor
                    ? `Dr. ${upcomingAppointments[0].doctor.firstName} ${upcomingAppointments[0].doctor.lastName}`
                    : "No Primary Doctor"}
                </div>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Insurance</span>
                <span className="font-medium text-navy-deep">BlueCross Gold</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Member ID</span>
                <span className="font-medium text-navy-deep">#89200192</span>
              </div>
            </div>
          </div>

          {/* Alerts & Tasks */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-navy-deep mb-4 flex items-center gap-2">
              Alerts & Tasks
              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer">
                <div className="flex gap-3">
                  <div className="mt-0.5 text-orange-500">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-deep">Complete Pre-visit Form</p>
                    <p className="text-xs text-slate-500 mt-1">Required before appointment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Telehealth Banner */}
          <div className="bg-gradient-to-br from-slate-800 to-navy-deep p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-medical-blue opacity-20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Telehealth is here</h3>
              <p className="text-sm text-slate-300 mb-4">Connect with specialists from the comfort of your home.</p>
              <Button variant="secondary" className="w-full bg-white text-navy-deep hover:bg-slate-100 border-none">Learn More</Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
