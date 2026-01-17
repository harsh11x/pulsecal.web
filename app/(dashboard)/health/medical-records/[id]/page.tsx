"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function RecordDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Medical Record Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Record ID: {params.id}
          </p>
          <p className="mt-4">Detailed view coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
