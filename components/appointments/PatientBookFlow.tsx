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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

  const fetchDoctors = async (search?: string) => {
    setLoading(true)
    setSelectedDoctor(null)
    setDoctorsError(null)
    try {
      const params = new URLSearchParams()
      params.set("limit", "200")
      if (search && search.trim()) params.set("search", search.trim())
      const raw: any = await apiService.get(`/doctors/search?${params}`)
      const list =
        Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.doctors)
            ? raw.doctors
            : Array.isArray(raw?.data?.doctors)
              ? raw.data.doctors
              : Array.isArray(raw?.data)
                ? raw.data
                : []
      setDoctors(list)
      setSearched(true)
      if (search && search.trim() && list.length > 0) {
        toast.success(list.length === 1 ? "1 doctor found" : `${list.length} doctors found`)
      }
      if (list.length === 0 && !search) {
        toast.info("No doctors in the system yet. They’ll appear once doctors register and complete their profile.")
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Could not load doctors"
      setDoctorsError(msg)
      setDoctors([])
      setSearched(true)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // On mount: load ALL doctors and ALL clinics (no location filter)
  useEffect(() => {
    fetchDoctors(undefined)
    fetchClinics()
  }, [])

  const handleSearch = () => {
    fetchDoctors(searchQuery.trim() || undefined)
  }

  const doctorId = (d: Doctor) => d.user?.id ?? d.userId ?? d.id ?? ""

  const [clinics, setClinics] = useState<any[]>([])
  const [selectedClinic, setSelectedClinic] = useState<any | null>(null)
  const [clinicDoctors, setClinicDoctors] = useState<Doctor[]>([])
  const [loadingClinics, setLoadingClinics] = useState(false)

  const fetchClinics = async () => {
    setLoadingClinics(true)
    setClinicsError(null)
    try {
      const params = new URLSearchParams({ limit: "100" })
      const r: any = await apiService.get(`/clinics?${params}`)
      let list = Array.isArray(r) ? r : (r?.clinics ?? r?.data?.clinics ?? r?.data ?? [])
      if (!Array.isArray(list)) list = []
      setClinics(list)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Could not load clinics"
      setClinicsError(msg)
      setClinics([])
    } finally {
      setLoadingClinics(false)
    }
  }

  const [loadingClinicDoctors, setLoadingClinicDoctors] = useState(false)

  const mapClinicStaff = (clinic: any, staff: any[]) =>
    (staff || []).map((s: any) => ({
      id: s.id,
      user: { id: s.id, firstName: s.firstName, lastName: s.lastName },
      specialization: s.doctorProfile?.specialization ?? s.specialization ?? "General",
      consultationFee: Number(s.doctorProfile?.consultationFee ?? s.consultationFee ?? 0),
      clinicName: clinic.name,
      services: s.doctorProfile?.services ?? s.services ?? [],
    }))

  const extractClinicStaff = (payload: any): any[] => {
    if (!payload) return []
    if (Array.isArray(payload.staff)) return payload.staff
    if (Array.isArray(payload.data?.staff)) return payload.data.staff
    if (Array.isArray(payload.doctors)) return payload.doctors
    return []
  }

  const openClinic = async (clinic: any) => {
    setSelectedClinic(clinic)
    setSelectedDoctor(null)
    setClinicDoctors(mapClinicStaff(clinic, extractClinicStaff(clinic)))
    setLoadingClinicDoctors(true)
    try {
      // apiService already unwraps { success, data }; tolerate either shape
      const detail: any = await apiService.get(`/clinics/${clinic.id}`)
      const full =
        detail?.id || detail?.name
          ? detail
          : detail?.data && typeof detail.data === "object"
            ? detail.data
            : detail
      const staff = extractClinicStaff(full).length
        ? extractClinicStaff(full)
        : extractClinicStaff(detail)
      if (full && (full.id || full.name)) {
        setSelectedClinic({ ...clinic, ...full })
      }
      setClinicDoctors(mapClinicStaff({ ...clinic, ...full }, staff))
    } catch (e: any) {
      console.error("Failed to load clinic doctors:", e)
      if (!extractClinicStaff(clinic).length) {
        toast.error(e?.response?.data?.message || "Could not load doctors for this clinic")
      }
    } finally {
      setLoadingClinicDoctors(false)
    }
  }

  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto pb-8">
      <Tabs defaultValue="symptom" className="flex flex-col">
        <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
          <TabsTrigger value="symptom">Find Doctors</TabsTrigger>
          <TabsTrigger value="clinic" onClick={() => fetchClinics()}>Browse Clinics</TabsTrigger>
        </TabsList>

        <TabsContent value="symptom" className="mt-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Find Doctors
          </CardTitle>
          <CardDescription>
            All doctors and clinics are shown (no location filter). Search by name, specialty, or clinic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="space-y-3">
            <label className="text-sm font-medium">Select Doctor</label>
            {doctorsError ? (
              <div className="text-center py-8 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <p className="text-sm text-destructive font-medium">{doctorsError}</p>
                <Button className="mt-3" variant="outline" size="sm" onClick={() => fetchDoctors(undefined)}>
                  Retry
                </Button>
              </div>
            ) : loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-muted-foreground text-sm font-medium">No doctors available yet.</p>
                <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                  Doctors appear here once they register and complete their profile. Try again later or ask your clinic to add doctors to the platform.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border p-2 sm:p-3">
                <div className="space-y-3 pb-4">
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
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarImage src={(doc as any).profileImage} alt={fullName || "Doctor"} />
                                <AvatarFallback>
                                  {((doc.user?.firstName ?? doc.firstName ?? "D")[0] || "D").toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
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
              </div>
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
              <p className="font-medium">No doctors available yet.</p>
              <p className="text-sm mt-1 max-w-sm mx-auto">Doctors will appear here once they register and complete their profile.</p>
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
                {loadingClinicDoctors ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : clinicDoctors.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No doctors at this clinic.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="max-h-[min(60vh,420px)] overflow-y-auto rounded-lg border p-2">
                      <div className="space-y-3 pr-1">
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
                    </div>
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
                    <Button className="mt-3" variant="outline" size="sm" onClick={() => fetchClinics()}>
                      Retry
                    </Button>
                  </div>
                ) : loadingClinics ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : clinics.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <p className="text-muted-foreground font-medium">No clinics available yet.</p>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                      Clinics appear here once doctors create them or an admin adds them. Try again later.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[min(65vh,560px)] min-h-[280px] overflow-y-auto rounded-md border p-2 overscroll-contain">
                    <div className="space-y-2 pr-1">
                      {clinics.map((c: any) => (
                        <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openClinic(c)}>
                          <CardContent className="p-4">
                            <p className="font-semibold">{c.name}</p>
                            <p className="text-sm text-muted-foreground">{c.address}, {c.city}</p>
                            {c.distance != null && <p className="text-xs text-muted-foreground">{c.distance} km away</p>}
                            {Array.isArray(c.staff) && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {c.staff.length} doctor{c.staff.length === 1 ? "" : "s"}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
