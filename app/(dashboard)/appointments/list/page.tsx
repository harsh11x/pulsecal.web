import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { AppointmentListPage } from "@/pages/appointments/AppointmentListPage"

export default function AppointmentList() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <AppointmentListPage />
      </AppLayout>
    </ProtectedRoute>
  )
}
