import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { AppointmentCalendarPage } from "@/pages/appointments/AppointmentCalendarPage"

export default function AppointmentCalendar() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <AppointmentCalendarPage />
      </AppLayout>
    </ProtectedRoute>
  )
}
