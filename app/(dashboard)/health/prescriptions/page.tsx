"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Pill } from "lucide-react"

export default function PrescriptionsPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prescriptions</h1>
        <p className="text-muted-foreground">Manage digital prescriptions</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Pill className="h-16 w-16 text-muted-foreground/50 mb-6" />
          <CardTitle className="text-xl mb-2">Coming Soon</CardTitle>
          <CardDescription className="max-w-md">
            Prescription management is under development. You&apos;ll soon be able to view, create, and manage digital prescriptions here.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
