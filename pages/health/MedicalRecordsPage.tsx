"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { AddMedicalRecordDialog } from "@/components/medical-records/AddMedicalRecordDialog"

export default function MedicalRecordsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleSuccess = () => {
    // Refresh medical records list
    // TODO: Implement fetching and displaying medical records
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Medical Records</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Record
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Medical Records</CardTitle>
          <CardDescription>View and manage your medical records</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Medical records list will be displayed here.</p>
        </CardContent>
      </Card>

      <AddMedicalRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

