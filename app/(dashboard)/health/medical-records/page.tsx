"use client"

import { ProtectedRoute } from "@/routes/ProtectedRoute"
import MedicalRecordsPage from "@/pages/health/MedicalRecordsPage"

export default function MedicalRecords() {
  return (
    <ProtectedRoute>
      <MedicalRecordsPage />
    </ProtectedRoute>
  )
}
