"use client"

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import RescheduleAppointmentPage from "@/pages/appointments/RescheduleAppointmentPage"

export default function RescheduleAppointment({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <AppLayout>
        <RescheduleAppointmentPage appointmentId={params.id} />
      </AppLayout>
    </ProtectedRoute>
  )
}
