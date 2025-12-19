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
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar as CalendarIcon, DollarSign, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import { format } from "date-fns"

interface Doctor {
  id: string
  firstName: string
  lastName: string
  specialization: string
  clinicName?: string
  consultationFee: number
  workingHours?: any
}

interface AppointmentBookingProps {
  doctorId?: string
  doctor?: Doctor
}

export function AppointmentBooking({ doctorId, doctor: initialDoctor }: AppointmentBookingProps) {
  const router = useRouter()
  const [doctor, setDoctor] = useState<Doctor | null>(initialDoctor || null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    reason: "",
    notes: "",
    paymentMethod: "credit_card" as "credit_card" | "debit_card" | "insurance" | "cash",
  })

  useEffect(() => {
    if (doctorId && !doctor) {
      fetchDoctor()
    }
  }, [doctorId])

  useEffect(() => {
    if (selectedDate && doctor) {
      fetchAvailableSlots()
    }
  }, [selectedDate, doctor])

  const fetchDoctor = async () => {
    try {
      const response: any = await apiService.get(`/api/v1/doctors/${doctorId}`)
      setDoctor(response?.data || response)
    } catch (error) {
      console.error("Failed to fetch doctor:", error)
      toast.error("Failed to load doctor information")
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !doctor) return

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const response: any = await apiService.get(`/api/v1/doctors/${doctor.id}/availability`, {
        params: { date: dateStr },
      })
      setAvailableSlots(response?.data || response || generateTimeSlots())
    } catch (error) {
      console.error("Failed to fetch slots:", error)
      setAvailableSlots(generateTimeSlots())
    }
  }

  const generateTimeSlots = (): string[] => {
    const slots: string[] = []
    for (let hour = 9; hour < 17; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`)
      slots.push(`${hour.toString().padStart(2, "0")}:30`)
    }
    return slots
  }

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !doctor) {
      toast.error("Please select date and time")
      return
    }

    setLoading(true)
    try {
      const appointmentDateTime = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(":")
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes))

      const appointmentData = {
        doctorId: doctor.id,
        scheduledAt: appointmentDateTime.toISOString(),
        reason: formData.reason,
        notes: formData.notes,
        paymentMethod: formData.paymentMethod,
      }

      const response: any = await apiService.post("/api/v1/appointments", appointmentData)
      
      toast.success("Appointment booked successfully!")
      router.push(`/appointments/${response?.data?.id || response?.id}`)
    } catch (error: any) {
      console.error("Booking error:", error)
      toast.error(error.message || "Failed to book appointment. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!doctor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Book Appointment</CardTitle>
          <CardDescription>
            {doctor.firstName} {doctor.lastName} - {doctor.specialization}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Doctor Info */}
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl font-bold">
                {doctor.firstName[0]}{doctor.lastName[0]}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {doctor.firstName} {doctor.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
              {doctor.clinicName && (
                <p className="text-sm text-muted-foreground">{doctor.clinicName}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${doctor.consultationFee}</p>
              <p className="text-xs text-muted-foreground">Consultation Fee</p>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div className="space-y-2">
              <Label>Select Time</Label>
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedTime === slot ? "default" : "outline"}
                    onClick={() => setSelectedTime(slot)}
                    className="w-full"
                  >
                    {slot}
                  </Button>
                ))}
              </div>
              {availableSlots.length === 0 && (
                <p className="text-sm text-muted-foreground">No available slots for this date</p>
              )}
            </div>
          )}

          {/* Appointment Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit *</Label>
              <Input
                id="reason"
                placeholder="e.g., General checkup, Follow-up, Consultation"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information you'd like to share..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Consultation Fee</span>
              <span className="font-semibold">${doctor.consultationFee}</span>
            </div>
            {selectedDate && selectedTime && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time</span>
                  <span className="font-semibold">
                    {format(selectedDate, "MMM dd, yyyy")} at {selectedTime}
                  </span>
                </div>
              </>
            )}
            <div className="border-t pt-2 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${doctor.consultationFee}</span>
            </div>
          </div>

          <Button
            onClick={handleBooking}
            disabled={loading || !selectedDate || !selectedTime || !formData.reason}
            className="w-full"
            size="lg"
          >
            {loading ? "Booking..." : "Confirm & Book Appointment"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

