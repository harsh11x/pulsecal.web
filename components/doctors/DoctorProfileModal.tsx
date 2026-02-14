"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Clock, DollarSign, Star, Phone, Mail, Calendar, Navigation, Stethoscope } from "lucide-react"
import Link from "next/link"

interface Doctor {
  id: string
  firstName: string
  lastName: string
  specialization: string
  clinicName?: string
  clinicAddress?: string
  clinicCity?: string
  clinicLatitude?: number
  clinicLongitude?: number
  consultationFee: number
  bio?: string
  services?: string[]
  profileImage?: string
  rating?: number
  totalReviews?: number
  distance?: number
  isAvailable?: boolean
  nextAvailableSlot?: string
  workingHours?: Record<string, { start: string; end: string; isOpen: boolean }>
  qualifications?: string
  yearsOfExperience?: number
}

interface DoctorProfileModalProps {
  doctor: Doctor | null
  isOpen: boolean
  onClose: () => void
  userLocation?: { lat: number; lng: number } | null
}

export function DoctorProfileModal({ doctor, isOpen, onClose, userLocation }: DoctorProfileModalProps) {
  const [bookingDate, setBookingDate] = useState<Date | undefined>(new Date())

  if (!doctor) return null

  const handleGetDirections = () => {
    if (doctor.clinicLatitude && doctor.clinicLongitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${doctor.clinicLatitude},${doctor.clinicLongitude}`
      window.open(url, "_blank")
    }
  }

  const handleBookAppointment = () => {
    // Navigate to booking page with doctor ID
    window.location.href = `/appointments/book?doctorId=${doctor.id}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {doctor.profileImage ? (
              <img
                src={doctor.profileImage}
                alt={`${doctor.firstName} ${doctor.lastName}`}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-12 w-12 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                Dr. {doctor.firstName} {doctor.lastName}
              </DialogTitle>
              <DialogDescription className="text-base mt-1">{doctor.specialization}</DialogDescription>
              {doctor.rating && (
                <div className="flex items-center gap-2 mt-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{doctor.rating}</span>
                  {doctor.totalReviews && (
                    <span className="text-sm text-muted-foreground">({doctor.totalReviews} reviews)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Clinic Information */}
          {doctor.clinicName && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">{doctor.clinicName}</h3>
                <div className="space-y-2">
                  {doctor.clinicAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p>{doctor.clinicAddress}</p>
                        {doctor.clinicCity && <p className="text-sm text-muted-foreground">{doctor.clinicCity}</p>}
                      </div>
                    </div>
                  )}
                  {doctor.distance && (
                    <p className="text-sm text-muted-foreground ml-6">{doctor.distance.toFixed(1)} km away</p>
                  )}
                  {doctor.clinicLatitude && doctor.clinicLongitude && (
                    <Button variant="outline" size="sm" onClick={handleGetDirections} className="mt-2">
                      <Navigation className="mr-2 h-4 w-4" />
                      Get Directions
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Professional Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Consultation Fee</span>
                    <span className="font-semibold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {doctor.consultationFee}
                    </span>
                  </div>
                  {doctor.yearsOfExperience && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Experience</span>
                      <span className="font-semibold">{doctor.yearsOfExperience} years</span>
                    </div>
                  )}
                  {doctor.qualifications && (
                    <div>
                      <span className="text-sm text-muted-foreground">Qualifications</span>
                      <p className="font-semibold mt-1">{doctor.qualifications}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {doctor.isAvailable !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Availability</span>
                      <Badge variant={doctor.isAvailable ? "default" : "secondary"}>
                        {doctor.isAvailable ? "Available" : "Not Available"}
                      </Badge>
                    </div>
                  )}
                  {doctor.nextAvailableSlot && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Next Available</span>
                      <span className="font-semibold flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {doctor.nextAvailableSlot}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bio */}
          {doctor.bio && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{doctor.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Services */}
          {doctor.services && doctor.services.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Services Offered</h3>
                <div className="flex flex-wrap gap-2">
                  {doctor.services.map((service, index) => (
                    <Badge key={index} variant="outline">
                      {service}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Working Hours */}
          {doctor.workingHours && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Working Hours</h3>
                <div className="space-y-2">
                  {Object.entries(doctor.workingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="capitalize">{day}</span>
                      {hours.isOpen ? (
                        <span className="text-sm">
                          {hours.start} - {hours.end}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleBookAppointment} className="flex-1" disabled={!doctor.isAvailable}>
              <Calendar className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

