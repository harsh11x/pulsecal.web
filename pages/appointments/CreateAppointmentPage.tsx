"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MapPin, DollarSign, Stethoscope } from "lucide-react"
import { apiService } from "@/services/api"
import { AppointmentBooking } from "@/components/appointments/AppointmentBooking"
import { toast } from "sonner"

interface Doctor {
  id: string
  firstName: string
  lastName: string
  specialization: string
  clinicName?: string
  clinicAddress?: string
  consultationFee: number
  profileImage?: string
  distance?: number
}

export default function CreateAppointmentPage() {
  const router = useRouter()
  const [step, setStep] = useState<"select-doctor" | "book-appointment">("select-doctor")
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [specializationFilter, setSpecializationFilter] = useState("")

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      // In a real app, we would debouce search and pass query params
      const response: any = await apiService.get("/api/v1/doctors/search")
      setDoctors(response.data || [])
    } catch (error) {
      console.error("Failed to fetch doctors:", error)
      toast.error("Failed to load doctors. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setStep("book-appointment")
  }

  const filteredDoctors = doctors.filter(doc => {
    const fullName = `${doc.firstName} ${doc.lastName}`.toLowerCase()
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clinicName?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  if (step === "book-appointment" && selectedDoctor) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Button variant="ghost" onClick={() => setStep("select-doctor")} className="mb-4">
          ← Back to Doctor Selection
        </Button>
        <AppointmentBooking doctorId={selectedDoctor.id} doctor={selectedDoctor} />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create New Appointment</h1>
        <p className="text-muted-foreground">Find a doctor and schedule your visit.</p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, specialization, or clinic..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading doctors...</div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No doctors found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary" onClick={() => handleDoctorSelect(doctor)}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={doctor.profileImage} />
                      <AvatarFallback>{doctor.firstName[0]}{doctor.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{doctor.firstName} {doctor.lastName}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Stethoscope className="h-3 w-3" /> {doctor.specialization}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-2">
                {doctor.clinicName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{doctor.clinicName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="h-3 w-3" />
                  <span>${doctor.consultationFee} Consultation Fee</span>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button className="w-full" onClick={() => handleDoctorSelect(doctor)}>Book Appointment</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

