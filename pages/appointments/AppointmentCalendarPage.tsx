"use client"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AppointmentCalendarPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Appointment Calendar</CardTitle>
          <CardDescription>View and manage your appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar mode="single" className="rounded-md border" />
        </CardContent>
      </Card>
    </div>
  )
}

