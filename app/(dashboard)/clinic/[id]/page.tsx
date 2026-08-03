"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Phone, Mail, Stethoscope, IndianRupee, Calendar } from "lucide-react"
import { apiService } from "@/services/api"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface Doctor {
  id: string
  firstName: string
  lastName: string
  specialization: string
  consultationFee: number
  services?: string[]
  doctorProfile?: { specialization: string; consultationFee: number; services?: string[] }
}

interface Clinic {
  id: string
  name: string
  address: string
  city: string
  phone: string
  email?: string
  staff?: Doctor[]
}

export default function ClinicDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params?.id) {
      apiService
        .get(`/clinics/${params.id}`)
        .then((data: any) => {
          const clinic = data?.data ?? data
          setClinic(clinic)
        })
        .catch(() => toast.error("Failed to load clinic"))
        .finally(() => setLoading(false))
    }
  }, [params?.id])

  if (loading || !clinic) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const doctors = Array.isArray(clinic.staff) ? clinic.staff : []

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{clinic.name}</CardTitle>
          <CardDescription>
            {clinic.address}, {clinic.city}
          </CardDescription>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            {clinic.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {clinic.phone}
              </span>
            )}
            {clinic.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {clinic.email}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Doctors at this clinic
          </CardTitle>
          <CardDescription>Select a doctor to book an appointment</CardDescription>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No doctors found at this clinic.</p>
          ) : (
            <div className="space-y-4">
              {doctors.map((doc) => {
                const profile = doc.doctorProfile ?? doc
                const spec = profile.specialization ?? doc.specialization
                const fee = Number(profile.consultationFee ?? doc.consultationFee ?? 0)
                const doctorUserId = doc.id
                return (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-lg">
                            Dr. {doc.firstName} {doc.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{spec}</p>
                          {profile.services && profile.services.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {profile.services.slice(0, 5).map((s: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-4 w-4" />
                            <span className="font-semibold">{fee}</span>
                            <span className="text-xs text-muted-foreground">/consultation</span>
                          </div>
                          <Button asChild size="sm">
                            <Link href={`/doctors/${doctorUserId}/book`}>
                              <Calendar className="h-4 w-4 mr-1" />
                              Book
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
