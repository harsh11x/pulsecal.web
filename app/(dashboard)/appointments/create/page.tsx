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
import { apiService } from "@/services/api"
import { toast } from "sonner"
import { format, addDays } from "date-fns"
import { Loader2, Calendar as CalendarIcon, Clock, User } from "lucide-react"
import { useAppSelector } from "@/app/hooks"

export default function CreateAppointmentPage() {
  const router = useRouter()
  const { user } = useAppSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)

  const [formData, setFormData] = useState({
    patientId: "",
    date: undefined as Date | undefined,
    time: "",
    reason: "",
    notes: "",
    type: "in-person"
  })

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true)
      // Since doctors are staff, they can access users list. Filter by role=patient
      const response: any = await apiService.get("/api/v1/users?role=PATIENT&limit=100")
      setPatients(response.data?.users || [])
    } catch (error) {
      console.error("Failed to fetch patients:", error)
      toast.error("Failed to load patient list")
    } finally {
      setLoadingPatients(false)
    }
  }

  const generateTimeSlots = () => {
    const slots = []
    for (let i = 9; i < 17; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`)
      slots.push(`${i.toString().padStart(2, '0')}:30`)
    }
    return slots
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.patientId || !formData.date || !formData.time) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)

      const scheduledAt = new Date(formData.date)
      const [hours, minutes] = formData.time.split(':')
      scheduledAt.setHours(parseInt(hours), parseInt(minutes))

      const appointmentData = {
        patientId: formData.patientId,
        doctorId: user?.id, // Determine automatically from backend or pass explicitly if needed
        scheduledAt: scheduledAt.toISOString(),
        reason: formData.reason,
        notes: formData.notes,
        status: "confirmed", // Auto-confirm doctor-created appointments
        type: formData.type
      }

      const response: any = await apiService.post("/api/v1/appointments", appointmentData)

      toast.success("Appointment created successfully")
      router.push(`/appointments/${response.data?.id || response.id}`)

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

            {/* Patient Selection */}
            <div className="space-y-2">
              <Label>Select Patient</Label>
              <Select
                value={formData.patientId}
                onValueChange={(val) => setFormData({ ...formData, patientId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingPatients ? "Loading patients..." : "Select a patient"} />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} ({patient.email})
                    </SelectItem>
                  ))}
                  {patients.length === 0 && !loadingPatients && (
                    <div className="p-2 text-sm text-muted-foreground text-center">No patients found</div>
                  )}
                </SelectContent>
              </Select>
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
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">In Person</SelectItem>
                      <SelectItem value="video">Video Consultation</SelectItem>
                    </SelectContent>
                  </Select>
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

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full" disabled={loading}>
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
