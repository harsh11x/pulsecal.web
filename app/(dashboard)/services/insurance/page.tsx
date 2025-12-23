"use client"

import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Calendar, DollarSign, FileText, Plus, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { toast } from "sonner"
import { format } from "date-fns"

export default function Insurance() {
  const [insurance, setInsurance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInsurance = async () => {
      try {
        const response: any = await apiService.get("/api/v1/patients/insurance")
        setInsurance(response.data)
      } catch (error) {
        console.error("Failed to fetch insurance:", error)
        // Ensure we handle empty/404 correctly if not set
      } finally {
        setLoading(false)
      }
    }
    fetchInsurance()
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Insurance Information</h1>
            <p className="text-muted-foreground">Manage your health insurance details</p>
          </div>
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Add Insurance
          </Button>
        </div>

        {!insurance ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No Insurance Added</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Add your insurance details to streamline billing and coverage verification.
              </p>
              <Button>Add Details Now</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Primary Insurance
                  </CardTitle>
                  <Badge>{insurance.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-semibold">{insurance.providerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Policy Number</p>
                  <p className="font-medium">{insurance.policyNumber}</p>
                </div>
                {insurance.groupNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Group Number</p>
                    <p className="font-medium">{insurance.groupNumber}</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  {insurance.coverageEndDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Expires: {format(new Date(insurance.coverageEndDate), 'MM/dd/yyyy')}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    Edit
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    View Card
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary placeholder or secondary insurance if supported */}
          </div>
        )}
      </div>
    </ProtectedRoute >
  )
}
