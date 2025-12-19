"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function MedicalRecordsPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Medical Records</h1>
        <Button onClick={() => router.push("/health/medical-records/create")}>
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
    </div>
  )
}

