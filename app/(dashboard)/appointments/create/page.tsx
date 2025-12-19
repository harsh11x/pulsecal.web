"use client"

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import CreateAppointmentPage from "@/pages/appointments/CreateAppointmentPage"

export default function CreateAppointment() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <CreateAppointmentPage />
      </AppLayout>
    </ProtectedRoute>
  )
}
