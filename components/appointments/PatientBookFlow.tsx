"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Stethoscope, MapPin, Loader2, Calendar, Building2, IndianRupee } from "lucide-react"
import { apiService } from "@/services/api"
import { toast } from "sonner"

interface Doctor {
  id?: string
  userId?: string
  firstName?: string
  lastName?: string
  specialization: string
  clinicName?: string
  consultationFee: number
  distance?: number
  user?: { id: string; firstName: string; lastName: string }
}

export function PatientBookFlow() {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => setUserLocation(null)
      )
    }
  }, [])

  const searchDoctors = async () => {
    if (!reason.trim()) {
      toast.error("Enter a symptom, condition, or reason (e.g. fever, cough, checkup)")
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams()
      params.set("reason", reason.trim())
      params.set("limit", "20")
      if (userLocation) {
        params.set("latitude", String(userLocation.lat))
        params.set("longitude", String(userLocation.lng))
        params.set("radius", "10")
      }
      const data: any = await apiService.get(`/doctors/search?${params}`)
      const list = data?.doctors ?? (Array.isArray(data) ? data : [])
      setDoctors(list)
      if (list.length === 0) {
        toast.info("No doctors found for this search. Try a different term like 'General Physician' or 'Fever'")
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to search doctors")
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  const doctorId = (d: Doctor) => d.user?.id ?? d.userId ?? d.id ?? ""

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search by symptom or reason
          </CardTitle>
          <CardDescription>
            Enter what you need help with (e.g. fever, cough, skin issue, checkup) to find doctors who can help
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="e.g. fever, cough, headache, checkup, skin..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchDoctors()}
              />
            </div>
            <Button onClick={searchDoctors} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {searched && (
        <Card>
          <CardHeader>
            <CardTitle>Doctors for &quot;{reason}&quot;</CardTitle>
            <CardDescription>
              {doctors.length} doctor(s) found. Select one to book an appointment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {doctors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No doctors found. Try &quot;General Physician&quot; or a different symptom.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map((doc) => (
                  <Card key={doctorId(doc)} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-lg">
                            Dr. {doc.user?.firstName ?? doc.firstName} {doc.user?.lastName ?? doc.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{doc.specialization}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm">
                            <Building2 className="h-3 w-3" />
                            {doc.clinicName || "Clinic"}
                          </div>
                          {doc.distance != null && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {doc.distance} km away
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-4 w-4" />
                            <span className="font-semibold">{Number(doc.consultationFee || 0)}</span>
                            <span className="text-xs text-muted-foreground">/consultation</span>
                          </div>
                          <Button
                            onClick={() => router.push(`/doctors/${doctorId(doc)}/book`)}
                            size="sm"
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Book
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
