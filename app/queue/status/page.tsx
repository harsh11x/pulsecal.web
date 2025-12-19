"use client"

import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { RoleGuard } from "@/routes/RoleGuard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, TrendingUp, Activity } from "lucide-react"

export default function QueueStatus() {
  const queueData = [
    {
      id: "1",
      patientName: "John Smith",
      appointmentTime: "10:00 AM",
      status: "waiting",
      waitTime: "15 min",
      doctor: "Dr. Sarah Johnson",
    },
    {
      id: "2",
      patientName: "Jane Doe",
      appointmentTime: "10:30 AM",
      status: "in_progress",
      waitTime: "5 min",
      doctor: "Dr. Michael Chen",
    },
    {
      id: "3",
      patientName: "Bob Wilson",
      appointmentTime: "11:00 AM",
      status: "checked_in",
      waitTime: "30 min",
      doctor: "Dr. Sarah Johnson",
    },
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      waiting: { color: "bg-warning/10 text-warning", label: "Waiting" },
      in_progress: { color: "bg-primary/10 text-primary", label: "In Progress" },
      checked_in: { color: "bg-success/10 text-success", label: "Checked In" },
    }
    const statusInfo = variants[status] || variants.waiting
    return (
      <Badge className={statusInfo.color} variant="secondary">
        {statusInfo.label}
      </Badge>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <RoleGuard permission="VIEW_QUEUE">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-balance">Queue Status</h1>
              <p className="text-muted-foreground">Real-time patient queue management</p>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Patients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">24</p>
                  <p className="text-xs text-muted-foreground mt-1">8 waiting</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Avg Wait Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">22 min</p>
                  <p className="text-xs text-success mt-1">-5 min from avg</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Active Rooms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">6/8</p>
                  <p className="text-xs text-muted-foreground mt-1">2 available</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Today's Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">42</p>
                  <p className="text-xs text-success mt-1">+8 from yesterday</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Current Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {queueData.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{patient.patientName}</p>
                          <p className="text-sm text-muted-foreground">{patient.doctor}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{patient.appointmentTime}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {patient.waitTime}
                          </p>
                        </div>
                        {getStatusBadge(patient.status)}
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Wait Time by Hour</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Chart visualization will be displayed here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Patient Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Flow diagram will be displayed here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </RoleGuard>
      </AppLayout>
    </ProtectedRoute>
  )
}
