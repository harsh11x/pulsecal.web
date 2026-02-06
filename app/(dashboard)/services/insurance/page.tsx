"use client"

import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Shield, Construction } from "lucide-react"

export default function Insurance() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-balance">Insurance Information</h1>
          <p className="text-muted-foreground">Manage your health insurance details</p>
        </div>

        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Construction className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-semibold">Coming Soon</h2>
            </div>
            <p className="text-muted-foreground max-w-md mb-4">
              Insurance management is under development. You&apos;ll soon be able to add your insurance details,
              policy numbers, and coverage information to streamline billing and claims.
            </p>
            <p className="text-sm text-muted-foreground">
              Check back later for updates!
            </p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
