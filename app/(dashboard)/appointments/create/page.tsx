"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiService } from "@/services/api"
import { toast } from "sonner"
import { format, addDays } from "date-fns"
import { Loader2, Calendar as CalendarIcon, Clock, User, Stethoscope, Search } from "lucide-react"
import { useAppSelector } from "@/app/hooks"
import { PatientBookFlow } from "@/components/appointments/PatientBookFlow"

interface ClinicDoctor {
  id: string
  firstName: string
  lastName: string
  email?: string
  doctorProfile?: { specialization?: string; consultationFee?: number }
}

export default function CreateAppointmentPage() {
  const router = useRouter()
  const { user } = useAppSelector((state) => state.auth)
  const isPatient = user?.role === "PATIENT"
  const isReceptionist = user?.role === "RECEPTIONIST"
  const isDoctor = user?.role === "DOCTOR"

  if (isPatient) {
    return (
      <div className="container mx-auto py-8">
        <PatientBookFlow />
      </div>
    )
  }
  const [loading, setLoading] = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(true)

  // Clinic doctors (for receptionists)
  const [clinicDoctors, setClinicDoctors] = useState<ClinicDoctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("")

  // Schedule settings from doctor's profile
  const [workingHours, setWorkingHours] = useState({ start: "09:00", end: "17:00" })
  const [slotDuration, setSlotDuration] = useState(30)
  const [blockedSlots, setBlockedSlots] = useState<{startTime: string, endTime: string}[]>([])

  const [formData, setFormData] = useState({
    patientDetails: {
      firstName: "",
      lastName: "",
      phone: "",
      email: ""
    },
    date: undefined as Date | undefined,
    time: "",
    reason: "",
    notes: "",
    type: "in-person"
  })

  const searchParams = useSearchParams()
  const [city, setCity] = useState("")

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${p.coords.latitude}&lon=${p.coords.longitude}&format=json`,
            { headers: { Accept: "application/json" } }
          )
            .then((r) => r.json())
            .then((data) => {
              const c = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county
              if (c) setCity(c)
            })
            .catch(() => {})
        },
        () => {}
      )
    }
  }, [])

  // Fetch doctors: receptionists only (clinic doctors). Doctors book for themselves - no fetch needed.
  useEffect(() => {
    if (!isReceptionist) {
      setClinicDoctors([])
      setLoadingDoctors(false)
      return
    }
    setLoadingDoctors(true)
    const loadDoctors = async () => {
      try {
        const data: any = await apiService.get("/receptionists/doctors")
        const list = Array.isArray(data) ? data : (data?.doctors ?? data?.data ?? [])
        setClinicDoctors(list)
        const doctorFromUrl = searchParams?.get("doctor")
        if (doctorFromUrl && list.some((d: { id: string }) => d.id === doctorFromUrl)) {
          setSelectedDoctorId(doctorFromUrl)
        } else if (list.length === 1) {
          setSelectedDoctorId(list[0].id)
        }
      } catch {
        toast.error("Failed to load clinic doctors")
        setClinicDoctors([])
      } finally {
        setLoadingDoctors(false)
      }
    }
    loadDoctors()
  }, [isReceptionist, searchParams])

  // Fetch doctor's schedule when component mounts or date changes (for doctors, use selected doctor for receptionists)
  useEffect(() => {
    fetchDoctorSchedule()
  }, [formData.date, selectedDoctorId])

  const fetchDoctorSchedule = async () => {
    try {
      setLoadingSchedule(true)
      // Use selected doctor for schedule; doctors can default to self
      const doctorId = isDoctor ? (selectedDoctorId || user?.id) : selectedDoctorId
      if (!doctorId) {
        setLoadingSchedule(false)
        return
      }

      const response: any = isReceptionist
        ? await apiService.get(`/doctors/${doctorId}`).catch(() => ({}))
        : await apiService.get("/doctor-profiles/me")
      const profile = response

      if (profile?.workingHours) {
        // Get default settings first
        const defaults = profile.workingHours.defaultSettings
        if (defaults) {
          if (defaults.workingHours) {
            setWorkingHours({
              start: defaults.workingHours.start || "09:00",
              end: defaults.workingHours.end || "17:00"
            })
          }
          if (defaults.slotDuration) {
            setSlotDuration(defaults.slotDuration)
          }
        } else {
          // Fallback to day-specific settings
          const selectedDate = formData.date || new Date()
          const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
          const daySchedule = profile.workingHours[dayName]
          if (daySchedule) {
            setWorkingHours({
              start: daySchedule.start || "09:00",
              end: daySchedule.end || "17:00"
            })
          }
        }

        // Load blocked slots for selected date
        if (formData.date) {
          const dateKey = format(formData.date, "yyyy-MM-dd")
          if (profile.workingHours.exceptions && profile.workingHours.exceptions[dateKey]) {
            const savedBlockedSlots = profile.workingHours.exceptions[dateKey]
            setBlockedSlots(Array.isArray(savedBlockedSlots) ? savedBlockedSlots : [])
          } else {
            setBlockedSlots([])
          }
        }
      }
    } catch (error) {
      console.warn("Failed to fetch doctor schedule:", error)
      // Use defaults if fetch fails
    } finally {
      setLoadingSchedule(false)
    }
  }

  const generateTimeSlots = () => {
    const slots: string[] = []
    const [startHour, startMin] = workingHours.start.split(":").map(Number)
    const [endHour, endMin] = workingHours.end.split(":").map(Number)

    let currentHour = startHour
    let currentMin = startMin

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const slotStart = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`
      
      // Check if this slot is blocked
      const isBlocked = blockedSlots.some(b => b.startTime === slotStart)
      
      if (!isBlocked) {
        slots.push(slotStart)
      }

      currentMin += slotDuration
      if (currentMin >= 60) {
        currentMin -= 60
        currentHour += 1
      }
    }

    return slots
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const doctorId = isDoctor ? (selectedDoctorId || user?.id) : selectedDoctorId
    if (!formData.patientDetails.firstName || !formData.patientDetails.phone || !formData.date || !formData.time) {
      toast.error("Please fill in required fields (Name, Phone, Date, Time)")
      return
    }
    if (!doctorId) {
      toast.error("Please select a doctor")
      return
    }

    try {
      setLoading(true)

      const scheduledAt = new Date(formData.date)
      const [hours, minutes] = formData.time.split(':')
      scheduledAt.setHours(parseInt(hours), parseInt(minutes))

      const appointmentData = {
        patientDetails: formData.patientDetails,
        doctorId: doctorId!,
        scheduledAt: scheduledAt.toISOString(),
        reason: formData.reason,
        notes: formData.notes,
        status: "confirmed",
        type: formData.type
      }

      const response: any = await apiService.post("/appointments", appointmentData)

      toast.success("Appointment created successfully")
      router.push(`/appointments/list`)
      // Redirect to list or view. response format changed slightly in controller maybe? 
      // Controller returns appointment object. 

    } catch (error: any) {
      console.error("Failed to create appointment:", error)
      const msg = error.response?.data?.message || error.message || "Failed to create appointment"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const timeSlots = generateTimeSlots()

  // Filter clinic doctors by search (name, specialty) - for receptionist
  const filteredClinicDoctors = doctorSearchQuery.trim()
    ? clinicDoctors.filter((doc) => {
        const q = doctorSearchQuery.toLowerCase()
        const name = `${doc.firstName} ${doc.lastName}`.toLowerCase()
        const spec = (doc.doctorProfile?.specialization ?? "").toLowerCase()
        return name.includes(q) || spec.includes(q)
      })
    : clinicDoctors

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Appointment</CardTitle>
          <CardDescription>Schedule an appointment for a patient</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">


            {/* Doctor Selection - receptionists only (doctors book for themselves) */}
            {!isDoctor && (
              <div className="space-y-4 border-2 border-primary/30 p-4 rounded-lg bg-primary/5">
                <h3 className="font-semibold flex items-center gap-2 text-base">
                  <Stethoscope className="h-5 w-5" />
                  Select Doctor <span className="text-destructive">*</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isReceptionist
                    ? "Search and select a doctor from your clinic"
                    : "Choose a doctor"}
                </p>
                {isReceptionist && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by doctor name or specialty..."
                      value={doctorSearchQuery}
                      onChange={(e) => setDoctorSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}
                {loadingDoctors ? (
                  <div className="flex items-center gap-2 py-6 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading doctors...
                  </div>
                ) : clinicDoctors.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground text-sm border rounded-md bg-muted/30">
                    {isReceptionist ? "No doctors in your clinic. Contact admin to add doctors." : "No doctors found."}
                  </div>
                ) : filteredClinicDoctors.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground text-sm border rounded-md bg-muted/30">
                    No doctors match &quot;{doctorSearchQuery}&quot;. Try a different search.
                  </div>
                ) : (
                  <>
                    <Select value={selectedDoctorId ?? ""} onValueChange={(v) => setSelectedDoctorId(v || null)}>
                      <SelectTrigger className="w-full h-11 text-base">
                        <SelectValue placeholder={isReceptionist ? "Choose a doctor from your clinic..." : "Choose a doctor..."} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px] overflow-y-auto">
                        {filteredClinicDoctors.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            Dr. {doc.firstName} {doc.lastName}
                            {doc.doctorProfile?.specialization && ` — ${doc.doctorProfile.specialization}`}
                            {doc.doctorProfile?.consultationFee != null && ` • ₹${doc.doctorProfile.consultationFee}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <ScrollArea className="h-[140px] rounded-md border p-2">
                      <div className="grid gap-1 pr-4">
                        {filteredClinicDoctors.map((doc) => (
                          <div
                            key={doc.id}
                            className={`flex items-start space-x-3 rounded-lg border p-2 cursor-pointer transition-colors ${
                              selectedDoctorId === doc.id ? "border-primary bg-primary/10" : "hover:bg-muted/50"
                            }`}
                            onClick={() => setSelectedDoctorId(doc.id)}
                          >
                            <Checkbox
                              id={`doctor-${doc.id}`}
                              checked={selectedDoctorId === doc.id}
                              onCheckedChange={(checked) => setSelectedDoctorId(checked ? doc.id : null)}
                            />
                            <label htmlFor={`doctor-${doc.id}`} className="text-sm cursor-pointer flex-1">
                              Dr. {doc.firstName} {doc.lastName}
                              {doc.doctorProfile?.specialization && (
                                <span className="text-muted-foreground"> • {doc.doctorProfile.specialization}</span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </div>
            )}

            {/* Patient Details (Manual Entry) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-muted/20">
              <div className="col-span-2">
                <h3 className="font-semibold mb-2">Patient Details</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.patientDetails.firstName}
                  onChange={(e) => setFormData({ ...formData, patientDetails: { ...formData.patientDetails, firstName: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.patientDetails.lastName}
                  onChange={(e) => setFormData({ ...formData, patientDetails: { ...formData.patientDetails, lastName: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+91 9876543210"
                  value={formData.patientDetails.phone}
                  onChange={(e) => setFormData({ ...formData, patientDetails: { ...formData.patientDetails, phone: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.patientDetails.email}
                  onChange={(e) => setFormData({ ...formData, patientDetails: { ...formData.patientDetails, email: e.target.value } })}
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Date</Label>
                <div className="border rounded-md p-2 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => setFormData({ ...formData, date })}
                    disabled={(date) => date < addDays(new Date(), -1)}
                    className="rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select
                    value={formData.time}
                    onValueChange={(val) => setFormData({ ...formData, time: val })}
                    disabled={!formData.date}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                    disabled
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">In Person</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">In-person consultations only.</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit</Label>
              <Input
                id="reason"
                placeholder="e.g. Regular Checkup, Fever, etc."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Internal notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-4 pt-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Appointment
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
