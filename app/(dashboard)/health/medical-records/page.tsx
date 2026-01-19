"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, User, Calendar, Loader2, Activity } from "lucide-react"
import { useState, useEffect } from "react"
import { AddMedicalRecordDialog } from "@/components/medical-records/AddMedicalRecordDialog"
import { apiService } from "@/services/api"
import { useAppSelector } from "@/app/hooks"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useSearchParams } from "next/navigation"

export default function MedicalRecordsPage() {
  const { user } = useAppSelector((state) => state.auth)
  const isDoctor = user?.role === "doctor"
  const [dialogOpen, setDialogOpen] = useState(false)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("action") === "new" && isDoctor) {
      setDialogOpen(true)
    }
  }, [searchParams, isDoctor])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const response: any = await apiService.get("/api/v1/medical-records") // Ensure this endpoint returns list
      setRecords(response.data || [])
    } catch (error) {
      console.error("Failed to fetch medical records:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const handleSuccess = () => {
    fetchRecords()
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Medical Records</h1>
          <p className="text-muted-foreground">{isDoctor ? "Patient Medical Records" : "My Health Records"}</p>
        </div>
        {isDoctor && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Record
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : records.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No medical records found</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {isDoctor ? "You haven't added any records yet." : "You don't have any medical records."}
            </p>
            {isDoctor && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Record
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {records.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center">
                      {record.title || record.diagnosis || "Medical Record"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {isDoctor ? `Patient: ${record.patientName || record.patient?.firstName}` : `Dr. ${record.doctorName || record.doctor?.firstName}`}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{format(new Date(record.visitDate || record.createdAt), "MMM d, yyyy")}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {record.description && (
                  <div className="text-sm">
                    <span className="font-semibold">Description/Symptoms:</span> {record.description}
                  </div>
                )}
                {record.treatment && (
                  <div className="text-sm">
                    <span className="font-semibold">Treatment:</span> {record.treatment}
                  </div>
                )}

                <div className="flex gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {record.recordType}
                  </Badge>
                </div>

                <Button variant="ghost" className="w-full h-8 text-xs border">View Full Record</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddMedicalRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
