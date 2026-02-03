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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
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

  const fetchDoctors = async (query?: string) => {
    setLoading(true)
    setSelectedDoctor(null)
    try {
      const params = new URLSearchParams()
      params.set("limit", "50")
      if (query && query.trim()) {
        params.set("search", query.trim())
        params.set("reason", query.trim())
      }
      if (userLocation) {
        params.set("latitude", String(userLocation.lat))
        params.set("longitude", String(userLocation.lng))
        params.set("radius", "15")
      }
      const data: any = await apiService.get(`/doctors/search?${params}`)
      const list = data?.doctors ?? (Array.isArray(data) ? data : [])
      setDoctors(list)
      setSearched(true)
      if (list.length === 0 && query) {
        toast.info("No doctors found. Try a different search.")
      }
    } catch {
      setDoctors([])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctors()
  }, [])

  const searchDoctors = async () => {
    const query = searchQuery.trim()
    if (!query) {
      toast.error("Enter doctor name, profession, clinic, or symptom")
      return
    }
    await fetchDoctors(query)
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
    setSelectedDoctor(null)
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
            <Stethoscope className="h-5 w-5" />
            Select Doctor
          </CardTitle>
          <CardDescription>
            Choose a doctor from the dropdown below to book an appointment. Use search to filter by name, specialization, or symptom.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Doctor</label>
            <Select
              value={selectedDoctor ? doctorId(selectedDoctor) : ""}
              onValueChange={(id) => {
                const doc = doctors.find((d) => doctorId(d) === id)
                setSelectedDoctor(doc ?? null)
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? "Loading doctors..." : "Select a doctor from the dropdown..."} />
              </SelectTrigger>
              <SelectContent className="max-h-[280px] overflow-y-auto">
                {doctors.map((doc) => (
                  <SelectItem key={doctorId(doc)} value={doctorId(doc)}>
                    Dr. {doc.user?.firstName ?? doc.firstName} {doc.user?.lastName ?? doc.lastName} — {doc.specialization} • {doc.clinicName || "Clinic"} • ₹{Number(doc.consultationFee || 0)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Input
              className="flex-1"
              placeholder="Filter by name, specialization, or symptom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchDoctors())}
            />
            <Button onClick={searchDoctors} disabled={loading} variant="outline">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </div>

          {selectedDoctor && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-muted/30">
              <div>
                <p className="font-semibold">Dr. {selectedDoctor.user?.firstName ?? selectedDoctor.firstName} {selectedDoctor.user?.lastName ?? selectedDoctor.lastName}</p>
                <p className="text-sm text-muted-foreground">{selectedDoctor.specialization}</p>
                <p className="text-sm flex items-center gap-1 mt-1">
                  <Building2 className="h-3 w-3" />
                  {selectedDoctor.clinicName || "Clinic"} • ₹{Number(selectedDoctor.consultationFee || 0)}/consultation
                </p>
              </div>
              <Button onClick={() => router.push(`/doctors/${doctorId(selectedDoctor)}/book`)}>
                <Calendar className="h-4 w-4 mr-1" />
                Book Appointment
              </Button>
            </div>
          )}

          {searched && doctors.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No doctors found. Try a different search term.</p>
            </div>
          )}
        </CardContent>
      </Card>
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
                <h4 className="font-medium mb-3">Select Doctor</h4>
                {clinicDoctors.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No doctors at this clinic.</p>
                ) : (
                  <div className="space-y-4">
                    <Select
                      value={selectedDoctor && clinicDoctors.some((d) => doctorId(d) === doctorId(selectedDoctor)) ? doctorId(selectedDoctor) : ""}
                      onValueChange={(id) => {
                        const doc = clinicDoctors.find((d) => doctorId(d) === id)
                        setSelectedDoctor(doc ?? null)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a doctor from this clinic..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[240px] overflow-y-auto">
                        {clinicDoctors.map((doc) => (
                          <SelectItem key={doctorId(doc)} value={doctorId(doc)}>
                            Dr. {doc.user?.firstName ?? doc.firstName} {doc.user?.lastName ?? doc.lastName} — {doc.specialization} • ₹{Number(doc.consultationFee || 0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedDoctor && clinicDoctors.some((d) => doctorId(d) === doctorId(selectedDoctor)) && (
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                        <div>
                          <p className="font-semibold">Dr. {selectedDoctor.user?.firstName ?? selectedDoctor.firstName} {selectedDoctor.user?.lastName ?? selectedDoctor.lastName}</p>
                          <p className="text-sm text-muted-foreground">{selectedDoctor.specialization} • ₹{Number(selectedDoctor.consultationFee || 0)}/consultation</p>
                        </div>
                        <Button size="sm" onClick={() => router.push(`/doctors/${doctorId(selectedDoctor)}/book`)}>
                          <Calendar className="h-4 w-4 mr-1" />
                          Book
                        </Button>
                      </div>
                    )}
                  </div>
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
