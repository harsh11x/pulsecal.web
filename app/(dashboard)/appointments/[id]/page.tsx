"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function AppointmentDetail({ params }: { params: { id: string } }) {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Appointment ID: {params.id}
          </p>
          <p className="mt-4">This detailed view is coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
