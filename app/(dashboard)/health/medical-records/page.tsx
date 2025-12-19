import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { MedicalRecordsPage } from "@/pages/health/MedicalRecordsPage"

export default function MedicalRecords() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <MedicalRecordsPage />
      </AppLayout>
    </ProtectedRoute>
  )
}
