import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { AppointmentDetailPage } from "@/pages/appointments/AppointmentDetailPage"

export default function AppointmentDetail({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <AppLayout>
        <AppointmentDetailPage appointmentId={params.id} />
      </AppLayout>
    </ProtectedRoute>
  )
}
