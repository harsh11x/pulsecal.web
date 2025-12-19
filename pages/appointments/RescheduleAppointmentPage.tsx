"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface RescheduleAppointmentPageProps {
  appointmentId: string
}

export function RescheduleAppointmentPage({ appointmentId }: RescheduleAppointmentPageProps) {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Reschedule Appointment</CardTitle>
          <CardDescription>Reschedule appointment ID: {appointmentId}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Reschedule form will be displayed here.</p>
          <Button onClick={() => router.back()} className="mt-4">
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

