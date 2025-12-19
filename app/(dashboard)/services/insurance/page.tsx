"use client"

import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Calendar, DollarSign, FileText, Plus } from "lucide-react"

export default function Insurance() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance">Insurance Information</h1>
              <p className="text-muted-foreground">Manage your health insurance details</p>
            </div>
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Add Insurance
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Primary Insurance
                  </CardTitle>
                  <Badge>Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-semibold">Blue Cross Blue Shield</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Policy Number</p>
                  <p className="font-medium">BCBS-123456789</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Group Number</p>
                  <p className="font-medium">GRP-987654</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Expires: 12/31/2025</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    Edit
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    View Card
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Secondary Insurance
                  </CardTitle>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-semibold">UnitedHealthcare</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Policy Number</p>
                  <p className="font-medium">UHC-987654321</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Group Number</p>
                  <p className="font-medium">GRP-456789</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Expires: 12/31/2025</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    Edit
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    View Card
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Coverage Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Deductible</p>
                  <p className="text-2xl font-bold">$500</p>
                  <p className="text-xs text-muted-foreground">$250 met</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Out-of-Pocket Max</p>
                  <p className="text-2xl font-bold">$3,000</p>
                  <p className="text-xs text-muted-foreground">$800 met</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Copay</p>
                  <p className="text-2xl font-bold">$25</p>
                  <p className="text-xs text-muted-foreground">per visit</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Recent Claims
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: "2024-12-15", provider: "Dr. Sarah Johnson", amount: "$150.00", status: "Approved" },
                  { date: "2024-11-28", provider: "LabCorp", amount: "$85.00", status: "Approved" },
                  { date: "2024-11-10", provider: "City Pharmacy", amount: "$45.00", status: "Processing" },
                ].map((claim, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{claim.provider}</p>
                      <p className="text-sm text-muted-foreground">{claim.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{claim.amount}</p>
                      <Badge variant={claim.status === "Approved" ? "default" : "secondary"} className="mt-1">
                        {claim.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
