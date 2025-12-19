"use client"

import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Video, Calendar, Clock, CheckCircle, User } from "lucide-react"

export default function Telemedicine() {
  const upcomingSession = {
    doctor: "Dr. Sarah Johnson",
    specialty: "Cardiology",
    date: "2025-01-20",
    time: "10:00 AM",
    duration: "30 minutes",
  }

  const pastSessions = [
    { id: "1", doctor: "Dr. Michael Chen", date: "2024-12-10", duration: "25 min", rating: 5 },
    { id: "2", doctor: "Dr. Emily Rodriguez", date: "2024-11-15", duration: "30 min", rating: 5 },
  ]

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-balance">Telemedicine</h1>
            <p className="text-muted-foreground">Virtual consultations with healthcare providers</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Virtual Visit</CardTitle>
                    <CardDescription>Your next telemedicine appointment</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary">Confirmed</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{upcomingSession.doctor}</p>
                    <p className="text-sm text-muted-foreground">{upcomingSession.specialty}</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-medium">{upcomingSession.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="font-medium">{upcomingSession.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium">{upcomingSession.duration}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1">
                    <Video className="mr-2 h-4 w-4" />
                    Join Video Call
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    Reschedule
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule New Visit
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Video className="mr-2 h-4 w-4" />
                  Test Video Setup
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Pre-Visit Checklist
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Past Telemedicine Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{session.doctor}</p>
                        <p className="text-sm text-muted-foreground">{session.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{session.duration}</p>
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: session.rating }).map((_, i) => (
                            <span key={i} className="text-yellow-500">
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Notes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                How Telemedicine Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <h4 className="font-semibold mb-1">Schedule</h4>
                  <p className="text-sm text-muted-foreground">Book a virtual appointment with your provider</p>
                </div>
                <div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <h4 className="font-semibold mb-1">Prepare</h4>
                  <p className="text-sm text-muted-foreground">Test your device and gather relevant information</p>
                </div>
                <div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <h4 className="font-semibold mb-1">Connect</h4>
                  <p className="text-sm text-muted-foreground">Join the secure video call at your appointment time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

