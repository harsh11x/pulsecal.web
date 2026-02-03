"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Stethoscope, MapPin, Loader2, Calendar, Building2, IndianRupee } from "lucide-react"
import { apiService } from "@/services/api"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    const query = reason.trim()
    if (!query) {
      toast.error("Enter doctor name, profession, clinic, or symptom (e.g. fever, cardiologist, Dr. Sharma)")
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams()
      params.set("search", query)
      params.set("reason", query) // Also search by symptom/reason
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
        toast.info("No doctors found. Try by name, specialization, clinic, or symptom.")
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to search doctors")
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  const doctorId = (d: Doctor) => d.user?.id ?? d.userId ?? d.id ?? ""

  const [clinics, setClinics] = useState<any[]>([])
  const [selectedClinic, setSelectedClinic] = useState<any | null>(null)
  const [clinicDoctors, setClinicDoctors] = useState<Doctor[]>([])
  const [loadingClinics, setLoadingClinics] = useState(false)

  const fetchClinics = async () => {
    setLoadingClinics(true)
    try {
      const params = new URLSearchParams({ limit: "50" })
      if (userLocation) {
        params.set("latitude", String(userLocation.lat))
        params.set("longitude", String(userLocation.lng))
        params.set("radius", "50")
      }
      const r: any = await apiService.get(`/clinics?${params}`)
      const list = Array.isArray(r) ? r : (r?.clinics ?? r?.data ?? [])
      setClinics(list)
    } catch {
      setClinics([])
    } finally {
      setLoadingClinics(false)
    }
  }

  const openClinic = (clinic: any) => {
    setSelectedClinic(clinic)
    const staff = clinic?.staff ?? []
    const docs = staff.map((s: any) => ({
      id: s.id,
      user: { id: s.id, firstName: s.firstName, lastName: s.lastName },
      specialization: s.doctorProfile?.specialization ?? "General",
      consultationFee: Number(s.doctorProfile?.consultationFee ?? 0),
      clinicName: clinic.name,
    }))
    setClinicDoctors(docs)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Tabs defaultValue="symptom">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="symptom">Find Doctors</TabsTrigger>
          <TabsTrigger value="clinic" onClick={fetchClinics}>Browse Clinics</TabsTrigger>
        </TabsList>

        <TabsContent value="symptom" className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Doctors
          </CardTitle>
          <CardDescription>
            Search by doctor name, profession, clinic, or symptom (e.g. Dr. Sharma, cardiologist, fever, clinic name)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Doctor name, specialization, clinic, or symptom..."
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
        </TabsContent>

        <TabsContent value="clinic" className="space-y-6 mt-4">
          {selectedClinic ? (
            <Card>
              <CardHeader className="pb-2">
                <Button variant="ghost" size="sm" className="w-fit -ml-2" onClick={() => setSelectedClinic(null)}>
                  ← Back to clinics
                </Button>
                <CardTitle>{selectedClinic.name}</CardTitle>
                <CardDescription>{selectedClinic.address}, {selectedClinic.city}</CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium mb-3">Doctors at this clinic</h4>
                {clinicDoctors.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No doctors at this clinic.</p>
                ) : (
                  <ScrollArea className="h-[280px] rounded-md border p-2">
                    <div className="space-y-2 pr-4">
                      {clinicDoctors.map((doc) => (
                        <Card key={doc.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold">Dr. {doc.user?.firstName ?? doc.firstName} {doc.user?.lastName ?? doc.lastName}</p>
                                <p className="text-sm text-muted-foreground">{doc.specialization}</p>
                                <p className="text-sm flex items-center gap-1 mt-0.5">
                                  <IndianRupee className="h-3 w-3" />
                                  {Number(doc.consultationFee || 0)}/consultation
                                </p>
                              </div>
                              <Button size="sm" onClick={() => router.push(`/doctors/${doc.user?.id ?? doc.id}/book`)}>
                                <Calendar className="h-4 w-4 mr-1" />
                                Book
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Select a clinic
                </CardTitle>
                <CardDescription>Choose a clinic to see available doctors</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingClinics ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : clinics.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No clinics found.</p>
                ) : (
                  <ScrollArea className="h-[300px] rounded-md border p-2">
                    <div className="space-y-2 pr-4">
                      {clinics.map((c: any) => (
                        <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openClinic(c)}>
                          <CardContent className="p-4">
                            <p className="font-semibold">{c.name}</p>
                            <p className="text-sm text-muted-foreground">{c.address}, {c.city}</p>
                            {c.distance != null && <p className="text-xs text-muted-foreground">{c.distance} km away</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
