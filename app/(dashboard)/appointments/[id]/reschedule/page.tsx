"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Calendar as CalendarIcon, Clock } from "lucide-react"
import { apiService } from "@/services/api"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Appointment } from "@/types"

export default function RescheduleAppointment({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [appointment, setAppointment] = useState<Appointment | null>(null)

  // Form state
  // Initializing with string dates for HTML inputs
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")

  useEffect(() => {
    fetchAppointment()
  }, [params.id])

  const fetchAppointment = async () => {
    try {
      setLoading(true)
      const data: any = await apiService.get(`/api/v1/appointments/${params.id}`)
      setAppointment(data)

      // Parse existing date/time if available
      if (data.scheduledAt) {
        const d = new Date(data.scheduledAt)
        setDate(d.toISOString().split('T')[0])
        // Extract time HH:MM
        const hours = d.getHours().toString().padStart(2, '0')
        const minutes = d.getMinutes().toString().padStart(2, '0')
        setTime(`${hours}:${minutes}`)
      }
    } catch (error) {
      console.error("Failed to fetch appointment:", error)
      toast.error("Failed to load appointment details")
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment || !date || !time) return

    setSubmitting(true)
    try {
      // Construct new ISO string
      // Note: This needs to be adjusted for timezone handling in a real production app
      const dateTime = new Date(`${date}T${time}:00`)

      await apiService.put(`/api/v1/appointments/${params.id}`, {
        scheduledAt: dateTime.toISOString(),
        status: "scheduled" // Reset status if it was cancelled/etc
      })

      toast.success("Appointment rescheduled successfully")
      router.push("/dashboard") // Or back to appointment details
    } catch (error: any) {
      console.error("Reschedule error:", error)
      toast.error(error.message || "Failed to reschedule appointment")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-muted-foreground">Appointment not found.</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Reschedule Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted/30 rounded-lg space-y-2">
            <p className="font-medium">Current Appointment</p>
            <div className="text-sm text-muted-foreground">
              <span className="block">Patient ID: {appointment.patientId}</span>
              {appointment.scheduledAt && (
                <span className="block">
                  Original Time: {new Date(appointment.scheduledAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleReschedule} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">New Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  className="pl-9"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">New Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  className="pl-9"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rescheduling...
                </>
              ) : "Confirm New Time"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
