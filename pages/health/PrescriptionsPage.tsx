"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrescriptionsPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Prescriptions</CardTitle>
          <CardDescription>View and manage your prescriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Prescriptions list will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  )
}

