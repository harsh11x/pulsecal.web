"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Pill, Clock, Calendar, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { prescriptionService, Prescription } from "@/services/prescription.service"
import { Badge } from "@/components/ui/badge"

export default function PrescriptionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const data = await prescriptionService.getPrescription(params.id)
        setPrescription(data)
      } catch (error) {
        console.error("Failed to load prescription:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPrescription()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-muted-foreground">Prescription not found.</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">Back</Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'expired': return 'destructive';
      case 'refill_requested': return 'secondary';
      default: return 'outline';
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Pill className="h-8 w-8 text-primary" />
            {prescription.medication}
          </h1>
          <p className="text-muted-foreground">Prescribed for: {prescription.patientName}</p>
        </div>
        <Badge variant={getStatusColor(prescription.status) as any} className="text-base px-3 py-1 capitalize">
          {prescription.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Prescription Details</CardTitle>
            <CardDescription>Issued by {prescription.doctor} on {new Date(prescription.date).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Dosage</Label>
                <p className="font-medium text-lg">{prescription.dosage}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Frequency</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <p className="font-medium">{prescription.frequency}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Duration</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <p className="font-medium">{prescription.duration}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Refills</Label>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{prescription.refillsRemaining} remaining</p>
                  <span className="text-muted-foreground text-sm">(of {prescription.refills} total)</span>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Instructions</Label>
                <div className="p-3 bg-muted/50 rounded-md mt-1">
                  <p className="text-sm">{prescription.instructions || "No special instructions."}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Label({ className, children }: { className?: string, children: React.ReactNode }) {
  return <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${className}`}>{children}</p>
}
