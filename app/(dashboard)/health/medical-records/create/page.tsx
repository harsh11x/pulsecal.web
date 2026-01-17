"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function CreateRecordPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Create Medical Record</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mt-4">Medical record creation form coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
