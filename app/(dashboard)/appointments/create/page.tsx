import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { CreateAppointmentPage } from "@/pages/appointments/CreateAppointmentPage"

export default function CreateAppointment() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <CreateAppointmentPage />
      </AppLayout>
    </ProtectedRoute>
  )
}
