"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pill, Calendar, User, FileText, Loader2 } from "lucide-react"
import { useAppSelector } from "@/app/hooks"
import { apiService } from "@/services/api"
import { format } from "date-fns"
import { AddPrescriptionDialog } from "@/components/health/AddPrescriptionDialog"
import { Badge } from "@/components/ui/badge"

export default function PrescriptionsPage() {
  const { user } = useAppSelector((state) => state.auth)
  const isDoctor = user?.role === "doctor"
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const response: any = await apiService.get("/api/v1/prescriptions")
      setPrescriptions(response.data || [])
    } catch (error) {
      console.error("Failed to fetch prescriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground">Manage digital prescriptions</p>
        </div>
        {isDoctor && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Prescription
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : prescriptions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Pill className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No prescriptions found</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {isDoctor ? "You haven't prescribed anything yet." : "You don't have any prescriptions."}
            </p>
            {isDoctor && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Write Prescription
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prescriptions.map((script) => (
            <Card key={script.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">
                    {isDoctor ? `Patient: ${script.patient?.firstName}` : `Dr. ${script.doctor?.firstName}`}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {format(new Date(script.createdAt || script.date), "MMM d, yyyy")}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/10">Active</Badge>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Pill className="h-4 w-4 text-primary" />
                    Medicines
                  </div>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    {script.medicines?.slice(0, 3).map((med: any, i: number) => (
                      <li key={i}>{med.name} - {med.dosage}</li>
                    ))}
                    {script.medicines?.length > 3 && <li>+{script.medicines.length - 3} more</li>}
                  </ul>
                </div>
                {script.notes && (
                  <div className="bg-muted/50 p-2 rounded text-xs italic text-muted-foreground">
                    "{script.notes}"
                  </div>
                )}
                <Button variant="outline" className="w-full text-xs h-8">View Details</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddPrescriptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchPrescriptions}
      />
    </div>
  )
}
