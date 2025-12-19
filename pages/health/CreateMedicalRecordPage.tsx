"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function CreateMedicalRecordPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Medical Record</CardTitle>
          <CardDescription>Add a new medical record</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Medical record creation form will be displayed here.</p>
          <Button onClick={() => router.back()} className="mt-4">
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

