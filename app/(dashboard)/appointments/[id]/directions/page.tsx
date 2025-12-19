"use client"

import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AppointmentDirections({ params }: { params: { id: string } }) {
  const router = useRouter()

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Directions to Appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Map integration will be displayed here</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Medical Center Address</h3>
                <p className="text-sm text-muted-foreground">123 Healthcare Blvd, Medical District, CA 90210</p>
                <Button className="w-full mt-4">Open in Maps</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

