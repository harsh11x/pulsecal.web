"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, FileText, User, Stethoscope, MapPin, DollarSign, Loader2 } from "lucide-react"
import { apiService } from "@/services/api"
import { toast } from "sonner"

interface Doctor {
  id: string
  firstName: string
  lastName: string
  specialization: string
  clinicName?: string
  clinicAddress?: string
  consultationFee: number
  profileImage?: string
}

export default function CreateAppointmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    reason: "",
    notes: "",
    doctorId: "",
    specialization: ""
  })

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    setLoadingDoctors(true)
    try {
      const response: any = await apiService.get("/api/v1/doctors/search")
      setDoctors(response.data || [])
    } catch (error) {
      console.error("Failed to fetch doctors:", error)
      // Don't show error toast - just show empty state
    } finally {
      setLoadingDoctors(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.doctorId) {
      toast.error("Please select a doctor")
      return
    }

    setLoading(true)
    try {
      // Combine date and time
      const scheduledAt = new Date(`${formData.date}T${formData.time}`)

      await apiService.post("/api/v1/appointments", {
        doctorId: formData.doctorId,
        scheduledAt: scheduledAt.toISOString(),
        reason: formData.reason,
        notes: formData.notes,
        duration: 30 // Default 30 minutes
      })

      toast.success("Appointment booked successfully!")
      router.push("/appointments/list")
    } catch (error: any) {
      console.error("Failed to create appointment:", error)
      toast.error(error?.response?.data?.message || "Failed to book appointment")
    } finally {
      setLoading(false)
    }
  }

  const filteredDoctors = formData.specialization
    ? doctors.filter(d => d.specialization === formData.specialization)
    : doctors

  const specializations = [...new Set(doctors.map(d => d.specialization))]

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Book an Appointment</h1>
        <p className="text-muted-foreground">Fill in the details to schedule your visit</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date and Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              When would you like to visit?
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Preferred Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Preferred Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Reason and Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              What brings you in?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit *</Label>
              <Input
                id="reason"
                placeholder="e.g., Regular checkup, Fever, Consultation"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information you'd like the doctor to know..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Doctor Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Select a Doctor
            </CardTitle>
            <CardDescription>
              {doctors.length === 0 && !loadingDoctors && "No doctors available at the moment"}
              {doctors.length > 0 && "Choose your preferred doctor"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Specialization Filter */}
            {specializations.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="specialization">Filter by Specialization</Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) => setFormData({ ...formData, specialization: value, doctorId: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All specializations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All specializations</SelectItem>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Doctor Selection */}
            <div className="space-y-2">
              <Label htmlFor="doctor">Choose Doctor *</Label>
              {loadingDoctors ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading doctors...
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Stethoscope className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No doctors available</p>
                  <p className="text-sm">
                    {formData.specialization
                      ? `No doctors found for ${formData.specialization}`
                      : "Please check back later or contact support"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => setFormData({ ...formData, doctorId: doctor.id })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.doctorId === doctor.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={doctor.profileImage} />
                          <AvatarFallback>{doctor.firstName[0]}{doctor.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">Dr. {doctor.firstName} {doctor.lastName}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Stethoscope className="h-3 w-3" />
                            {doctor.specialization}
                          </p>
                          {doctor.clinicName && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {doctor.clinicName}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${doctor.consultationFee}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.doctorId}
            className="flex-1"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Book Appointment
          </Button>
        </div>
      </form>
    </div>
  )
}
