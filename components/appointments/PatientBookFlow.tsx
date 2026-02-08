"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Stethoscope, Loader2, Calendar, Building2, IndianRupee } from "lucide-react"
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
  services?: string[]
  user?: { id: string; firstName: string; lastName: string }
}

export function PatientBookFlow() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [city, setCity] = useState("")
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [doctorsError, setDoctorsError] = useState<string | null>(null)
  const [clinicsError, setClinicsError] = useState<string | null>(null)

  // Get user's city from geolocation (optional default) — does not trigger refetch
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${p.coords.latitude}&lon=${p.coords.longitude}&format=json`,
            { headers: { Accept: "application/json" } }
          )
            .then((r) => r.json())
            .then((data) => {
              const c = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county
              if (c) setCity(c)
            })
            .catch(() => {})
        },
        () => {}
      )
    }
  }, [])

  const fetchDoctors = async (search?: string, useCityFilter?: boolean) => {
    setLoading(true)
    setSelectedDoctor(null)
    setDoctorsError(null)
    try {
      const params = new URLSearchParams()
      params.set("limit", "200")
      if (useCityFilter === true && city && city.trim()) {
        params.set("city", city.trim())
      }
      if (search && search.trim()) {
        params.set("search", search.trim())
      }
      let data: any = await apiService.get(`/doctors/search?${params}`)
      let list = data?.doctors ?? (Array.isArray(data) ? data : [])
      if (list.length === 0 && city && city.trim()) {
        const paramsNoCity = new URLSearchParams()
        paramsNoCity.set("limit", "200")
        if (search && search.trim()) paramsNoCity.set("search", search.trim())
        data = await apiService.get(`/doctors/search?${paramsNoCity}`)
        list = data?.doctors ?? (Array.isArray(data) ? data : [])
      }
      setDoctors(Array.isArray(list) ? list : [])
      setSearched(true)
      if ((Array.isArray(list) ? list : []).length === 0) {
        toast.info("No doctors found. Try a different city or search term.")
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Could not load doctors"
      setDoctorsError(msg)
      setDoctors([])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  // On mount only: load ALL doctors and ALL clinics (no city) so lists always show
  useEffect(() => {
    fetchDoctors(undefined, false)
    fetchClinics(false)
  }, [])

  const handleSearch = () => {
    fetchDoctors(searchQuery.trim() || undefined, true)
  }

  const doctorId = (d: Doctor) => d.user?.id ?? d.userId ?? d.id ?? ""

  const [clinics, setClinics] = useState<any[]>([])
  const [selectedClinic, setSelectedClinic] = useState<any | null>(null)
  const [clinicDoctors, setClinicDoctors] = useState<Doctor[]>([])
  const [loadingClinics, setLoadingClinics] = useState(false)

  const fetchClinics = async (useCityFilter = true) => {
    setLoadingClinics(true)
    setClinicsError(null)
    try {
      const params = new URLSearchParams({ limit: "100" })
      if (useCityFilter && city && city.trim()) {
        params.set("city", city.trim())
      }
      let r: any = await apiService.get(`/clinics?${params}`)
      let list = Array.isArray(r) ? r : (r?.clinics ?? r?.data ?? [])
      if (!Array.isArray(list)) list = []
      if (list.length === 0 && city && city.trim()) {
        r = await apiService.get("/clinics?limit=100")
        list = Array.isArray(r) ? r : (r?.clinics ?? r?.data ?? [])
        if (!Array.isArray(list)) list = []
      }
      setClinics(list)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Could not load clinics"
      setClinicsError(msg)
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <Tabs defaultValue="symptom">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="symptom">Find Doctors</TabsTrigger>
          <TabsTrigger value="clinic" onClick={() => fetchClinics(true)}>Browse Clinics</TabsTrigger>
        </TabsList>

        <TabsContent value="symptom" className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Find Doctors
          </CardTitle>
          <CardDescription>
            Search by name, specialty, or clinic. All doctors (with clinic names and rates) are shown. Enter city to filter by location.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search by name, specialty, or clinic</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Doctor name, specialization, clinic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading} variant="secondary">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">City (optional - filter by location)</label>
              <Input
                placeholder="e.g. Amritsar, Delhi, Mumbai — leave blank for all"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Select Doctor</label>
            {doctorsError ? (
              <div className="text-center py-8 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <p className="text-sm text-destructive font-medium">{doctorsError}</p>
                <Button className="mt-3" variant="outline" size="sm" onClick={() => fetchDoctors(undefined, false)}>
                  Retry
                </Button>
              </div>
            ) : loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : doctors.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No doctors found. Try a different city or search.</p>
            ) : (
              <ScrollArea className="h-[400px] rounded-lg border p-2">
                <div className="space-y-3 pr-4">
                  {doctors.map((doc) => {
                    const isSelected = selectedDoctor && doctorId(selectedDoctor) === doctorId(doc)
                    const fullName = `Dr. ${doc.user?.firstName ?? doc.firstName ?? ""} ${doc.user?.lastName ?? doc.lastName ?? ""}`.trim()
                    const clinic = doc.clinicName || "Clinic"
                    const fee = Number(doc.consultationFee || 0)
                    const services = Array.isArray(doc.services) ? doc.services : []
                    return (
                      <Card
                        key={doctorId(doc)}
                        className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "border-primary border-2 bg-primary/5 ring-2 ring-primary/20" : "hover:border-primary/50"}`}
                        onClick={() => setSelectedDoctor(doc)}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base break-words">{fullName || "Dr. Unknown"}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">{doc.specialization}</p>
                              <p className="text-sm flex items-start gap-1.5 mt-2 text-foreground">
                                <Building2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                <span className="break-words">{clinic}</span>
                              </p>
                              {services.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {services.slice(0, 5).map((s, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s}</span>
                                  ))}
                                  {services.length > 5 && (
                                    <span className="text-xs text-muted-foreground">+{services.length - 5} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <p className="font-semibold text-base flex items-center gap-1">
                                <IndianRupee className="h-4 w-4" />
                                {fee > 0 ? `₹${fee}` : "Free"}
                              </p>
                              <Button size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/doctors/${doctorId(doc)}/book`) }}>
                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                Book
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {selectedDoctor && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
              <div>
                <p className="font-semibold">Dr. {selectedDoctor.user?.firstName ?? selectedDoctor.firstName} {selectedDoctor.user?.lastName ?? selectedDoctor.lastName}</p>
                <p className="text-sm text-muted-foreground">{selectedDoctor.specialization}</p>
                <p className="text-sm flex items-center gap-1 mt-1">
                  <Building2 className="h-3 w-3" />
                  {selectedDoctor.clinicName || "Clinic"}
                </p>
                <p className="flex items-center gap-1 mt-2 font-semibold text-base">
                  <IndianRupee className="h-4 w-4" />
                  {Number(selectedDoctor.consultationFee || 0) > 0
                    ? `₹${Number(selectedDoctor.consultationFee || 0)} consultation fee (pay before booking)`
                    : "Free consultation"}
                </p>
              </div>
              <Button onClick={() => router.push(`/doctors/${doctorId(selectedDoctor)}/book`)}>
                <Calendar className="h-4 w-4 mr-1" />
                {Number(selectedDoctor.consultationFee || 0) > 0 ? "Pay & Book" : "Book Appointment"}
              </Button>
            </div>
          )}

          {searched && doctors.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No doctors found. Try a different city or search term.</p>
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
                    <ScrollArea className="h-[320px] rounded-lg border p-2">
                      <div className="space-y-3 pr-4">
                        {clinicDoctors.map((doc) => {
                          const isSelected = selectedDoctor && doctorId(selectedDoctor) === doctorId(doc)
                          const fullName = `Dr. ${doc.user?.firstName ?? doc.firstName ?? ""} ${doc.user?.lastName ?? doc.lastName ?? ""}`.trim()
                          const fee = Number(doc.consultationFee || 0)
                          return (
                            <Card
                              key={doctorId(doc)}
                              className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "border-primary border-2 bg-primary/5" : "hover:border-primary/50"}`}
                              onClick={() => setSelectedDoctor(doc)}
                            >
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-base break-words">{fullName || "Dr. Unknown"}</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">{doc.specialization}</p>
                                    <p className="text-sm flex items-center gap-1.5 mt-2 font-medium">
                                      <IndianRupee className="h-3.5 w-3.5" />
                                      {fee > 0 ? `₹${fee}` : "Free"}
                                    </p>
                                  </div>
                                  <Button size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/doctors/${doctorId(doc)}/book`) }}>
                                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                    Book
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </ScrollArea>
                    {selectedDoctor && clinicDoctors.some((d) => doctorId(d) === doctorId(selectedDoctor)) && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                        <div>
                          <p className="font-semibold">Dr. {selectedDoctor.user?.firstName ?? selectedDoctor.firstName} {selectedDoctor.user?.lastName ?? selectedDoctor.lastName}</p>
                          <p className="text-sm text-muted-foreground">{selectedDoctor.specialization}</p>
                          <p className="flex items-center gap-1 mt-1 font-semibold text-sm">
                            <IndianRupee className="h-3 w-3" />
                            {Number(selectedDoctor.consultationFee || 0) > 0
                              ? `₹${Number(selectedDoctor.consultationFee || 0)} (pay before booking)`
                              : "Free consultation"}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => router.push(`/doctors/${doctorId(selectedDoctor)}/book`)}>
                          <Calendar className="h-4 w-4 mr-1" />
                          {Number(selectedDoctor.consultationFee || 0) > 0 ? "Pay & Book" : "Book"}
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
                {clinicsError ? (
                  <div className="text-center py-8 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                    <p className="text-sm text-destructive font-medium">{clinicsError}</p>
                    <Button className="mt-3" variant="outline" size="sm" onClick={() => fetchClinics(false)}>
                      Retry
                    </Button>
                  </div>
                ) : loadingClinics ? (
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
