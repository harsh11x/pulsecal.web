"use client"

import { ProtectedRoute } from "@/routes/ProtectedRoute"
import CreateAppointmentPage from "@/pages/appointments/CreateAppointmentPage"

export default function CreateAppointment() {
  return (
    <ProtectedRoute>
      <CreateAppointmentPage />
    </ProtectedRoute>
  )
}
