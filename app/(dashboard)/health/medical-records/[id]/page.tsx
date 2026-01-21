"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, User, FileText, Pill, Activity } from "lucide-react"
import { medicalRecordService, MedicalRecord } from "@/services/medicalRecord.service"
import { Loader2 } from "lucide-react"

export default function RecordDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [record, setRecord] = useState<MedicalRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const data = await medicalRecordService.getMedicalRecord(params.id)
        setRecord(data)
      } catch (error) {
        console.error("Failed to load record:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecord()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-muted-foreground">Record not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Medical Record</h1>
            <p className="text-muted-foreground">Date: {new Date(record.date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><span className="font-semibold">Name:</span> {record.patientName}</p>
              <p><span className="font-semibold">Patient ID:</span> {record.patientId}</p>
              <p><span className="font-semibold">Doctor:</span> {record.doctor}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Diagnosis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Primary Diagnosis</h4>
                <p className="p-3 bg-muted rounded-md">{record.diagnosis}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Symptoms</h4>
                <p className="text-muted-foreground">{record.symptoms}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" />
                Treatment Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Prescribed Treatment</h4>
                  <p className="text-sm leading-relaxed">{record.treatment}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Medications</h4>
                  <p className="text-sm leading-relaxed">{record.medications || "No medications prescribed"}</p>
                </div>
              </div>
              {record.followUpDate && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t text-sm text-primary font-medium">
                  <Calendar className="h-4 w-4" />
                  Follow-up scheduled for: {new Date(record.followUpDate).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
