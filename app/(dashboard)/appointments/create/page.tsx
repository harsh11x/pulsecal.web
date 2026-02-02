"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Loader2, Calendar as CalendarIcon, Clock, User, Stethoscope } from "lucide-react"
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
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)

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

  // Fetch clinic doctors for receptionists
  useEffect(() => {
    if (isReceptionist) {
      apiService.get("/receptionists/doctors").then((data: any) => {
        const doctors = Array.isArray(data) ? data : (data?.doctors ?? [])
        setClinicDoctors(doctors)
        if (doctors.length === 1) setSelectedDoctorId(doctors[0].id)
      }).catch(() => toast.error("Failed to load clinic doctors"))
    }
  }, [isReceptionist])

  // Fetch doctor's schedule when component mounts or date changes (for doctors, use selected doctor for receptionists)
  useEffect(() => {
    fetchDoctorSchedule()
  }, [formData.date, selectedDoctorId])

  const fetchDoctorSchedule = async () => {
    try {
      setLoadingSchedule(true)
      // Receptionists use selected doctor's profile; doctors use their own
      const doctorId = isReceptionist ? selectedDoctorId : user?.id
      if (isReceptionist && !doctorId) {
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

    const doctorId = isReceptionist ? selectedDoctorId : user?.id
    if (!formData.patientDetails.firstName || !formData.patientDetails.phone || !formData.date || !formData.time) {
      toast.error("Please fill in required fields (Name, Phone, Date, Time)")
      return
    }
    if (isReceptionist && !doctorId) {
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
      toast.error(error.response?.data?.message || "Failed to create appointment")
    } finally {
      setLoading(false)
    }
  }

  const timeSlots = generateTimeSlots()

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Appointment</CardTitle>
          <CardDescription>Schedule an appointment for a patient</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">


            {/* Doctor Selection (Receptionists only) */}
            {isReceptionist && clinicDoctors.length > 0 && (
              <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                <h3 className="font-semibold flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Select Doctor
                </h3>
                <p className="text-sm text-muted-foreground">Choose the doctor for this appointment</p>
                <ScrollArea className="h-[180px] rounded-md border p-2">
                <div className="grid gap-2 pr-4">
                  {clinicDoctors.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        selectedDoctorId === doc.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedDoctorId(doc.id)}
                    >
                      <Checkbox
                        id={`doctor-${doc.id}`}
                        checked={selectedDoctorId === doc.id}
                        onCheckedChange={(checked) => setSelectedDoctorId(checked ? doc.id : null)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`doctor-${doc.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          Dr. {doc.firstName} {doc.lastName}
                        </label>
                        {doc.doctorProfile?.specialization && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {doc.doctorProfile.specialization}
                            {doc.doctorProfile.consultationFee != null && (
                              <> • ₹{doc.doctorProfile.consultationFee}</>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                </ScrollArea>
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
