"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function PrescriptionDetailPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Prescription Details</CardTitle>
          <CardDescription>View prescription information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Prescription details will be displayed here.</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

