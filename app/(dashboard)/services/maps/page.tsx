"use client"

import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Navigation, Phone, Clock, Star } from "lucide-react"

export default function Maps() {
  const nearbyFacilities = [
    {
      id: "1",
      name: "City Medical Center",
      type: "Hospital",
      distance: "0.8 miles",
      rating: 4.5,
      address: "123 Healthcare Blvd",
      phone: "(555) 123-4567",
      hours: "24/7",
    },
    {
      id: "2",
      name: "Wellness Clinic",
      type: "Clinic",
      distance: "1.2 miles",
      rating: 4.8,
      address: "456 Medical Ave",
      phone: "(555) 234-5678",
      hours: "Mon-Fri: 8AM-6PM",
    },
    {
      id: "3",
      name: "Express Care Urgent Care",
      type: "Urgent Care",
      distance: "2.1 miles",
      rating: 4.3,
      address: "789 Health St",
      phone: "(555) 345-6789",
      hours: "Daily: 9AM-9PM",
    },
  ]

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-balance">Find Healthcare Facilities</h1>
            <p className="text-muted-foreground">Locate nearby hospitals, clinics, and pharmacies</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Input placeholder="Search for facilities, pharmacies, or specialists..." className="flex-1" />
                <Button>
                  <MapPin className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Map View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Interactive map will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Nearby Facilities</h2>
            {nearbyFacilities.map((facility) => (
              <Card key={facility.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{facility.name}</h3>
                          <span className="text-xs px-2 py-1 bg-muted rounded-full">{facility.type}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="text-sm font-medium">{facility.rating}</span>
                          <span className="text-sm text-muted-foreground ml-2">{facility.distance} away</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{facility.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{facility.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{facility.hours}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button size="sm">
                        <Navigation className="mr-2 h-4 w-4" />
                        Directions
                      </Button>
                      <Button variant="outline" size="sm" className="bg-transparent">
                        Call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

