"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, Navigation, Stethoscope, Star, Filter } from "lucide-react"
import { apiService } from "@/services/api"
import { toast } from "sonner"
import { DoctorProfileModal } from "./DoctorProfileModal"

// Dynamically import LeafletMap with SSR disabled
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-muted/20">Loading Map...</div>
})

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
}

export function DoctorDiscoveryMap() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]) // Default to India center
  const [mapZoom, setMapZoom] = useState(5)
  const [searchQuery, setSearchQuery] = useState("")
  const [city, setCity] = useState("")
  const [specializationFilter, setSpecializationFilter] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available">("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)

  const specializations = [
    "All Specializations",
    "General Physician",
    "Cardiologist",
    "Dermatologist",
    "Dentist",
    "ENT Specialist",
    "Gastroenterologist",
    "General Surgeon",
    "Gynecologist",
    "Neurologist",
    "Oncologist",
    "Ophthalmologist",
    "Orthopedic",
    "Pediatrician",
    "Psychiatrist",
    "Pulmonologist",
    "Urologist",
    "Nephrologist",
    "Endocrinologist",
    "Ayurveda",
    "Homeopathy",
    "Physiotherapist",
  ]

  useEffect(() => {
    // Get user's current location and reverse geocode to city
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter([latitude, longitude]);
          setMapZoom(12);
          // Reverse geocode to get city for filtering
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { Accept: "application/json" } }
          )
            .then((r) => r.json())
            .then((data) => {
              const c = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county;
              if (c) setCity(c);
            })
            .catch(() => { });
        },
        (error) => {
          console.error("Error getting location:", error)
          toast.error("Allow location to find doctors near you, or enter a city below.")
        }
      )
    }
  }, [])

  useEffect(() => {
    if (userLocation || (city && city.trim())) {
      fetchDoctors()
    } else {
      setDoctors([])
    }
  }, [userLocation, city])

  useEffect(() => {
    filterDoctors()
  }, [doctors, searchQuery, specializationFilter, availabilityFilter, priceRange])

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { limit: 100 }
      if (userLocation) {
        params.latitude = userLocation.lat
        params.longitude = userLocation.lng
      }
      if (city && city.trim()) {
        params.city = city.trim()
      }
      if (specializationFilter && specializationFilter !== "All Specializations") {
        params.specialization = specializationFilter
      }
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      const response: any = await apiService.get("/doctors/search", { params })
      console.log("Doctors search response:", response)
      let doctorsData = response?.doctors ?? response?.data ?? (Array.isArray(response) ? response : [])

      if (!Array.isArray(doctorsData)) {
        doctorsData = []
      }

      if (userLocation && doctorsData.length > 0) {
        doctorsData = doctorsData.map((doctor: Doctor) => {
          if (doctor.clinicLatitude != null && doctor.clinicLongitude != null) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              doctor.clinicLatitude,
              doctor.clinicLongitude
            )
            return { ...doctor, distance }
          }
          return { ...doctor, distance: undefined }
        })
        doctorsData.sort((a: Doctor, b: Doctor) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      }

      setDoctors(doctorsData)
    } catch (error: any) {
      console.error("Failed to fetch doctors:", error)
      toast.error("Failed to load doctors")
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  const filterDoctors = () => {
    let filtered = [...doctors]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (doctor) =>
          `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(query) ||
          doctor.clinicName?.toLowerCase().includes(query) ||
          doctor.specialization.toLowerCase().includes(query) ||
          doctor.services?.some((s) => s.toLowerCase().includes(query))
      )
    }

    if (specializationFilter && specializationFilter !== "All Specializations") {
      filtered = filtered.filter((doctor) => doctor.specialization === specializationFilter)
    }

    if (availabilityFilter === "available") {
      filtered = filtered.filter((doctor) => doctor.isAvailable)
    }

    filtered = filtered.filter(
      (doctor) => doctor.consultationFee >= priceRange[0] && doctor.consultationFee <= priceRange[1]
    )

    setFilteredDoctors(filtered)
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    if (doctor.clinicLatitude && doctor.clinicLongitude) {
      setMapCenter([doctor.clinicLatitude, doctor.clinicLongitude])
      setMapZoom(15)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find Doctors Near You</h1>
        <p className="text-muted-foreground">Discover healthcare providers in your area</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Search & Filter</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by doctor name, clinic, specialization, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {!userLocation && (
              <Button
                onClick={() => {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      setUserLocation({ lat: latitude, lng: longitude });
                      setMapCenter([latitude, longitude]);
                      setMapZoom(12);
                      fetchDoctors();
                    },
                    (error) => toast.error("Location access denied")
                  )
                }}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Use My Location
              </Button>
            )}
          </div>

          {(city || !userLocation) && (
            <div className="space-y-2 pt-4 border-t">
              <Label>City</Label>
              <Input
                placeholder="Enter city to search (e.g. Mumbai, Delhi)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={() => city && fetchDoctors()}
              />
            </div>
          )}

          {showFilters && (
            <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
              <div className="space-y-2">
                <Label>Specialization</Label>
                <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All specializations" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Availability</Label>
                <Select value={availabilityFilter} onValueChange={(v: any) => setAvailabilityFilter(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Doctors</SelectItem>
                    <SelectItem value="available">Available Now</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    className="w-24"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 500])}
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-200px)] min-h-[600px]">
        {/* Map */}
        <Card className="lg:col-span-2 h-full flex flex-col">
          <CardHeader className="flex-none">
            <CardTitle>Map View</CardTitle>
            <CardDescription>
              {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative min-h-[400px]">
            <div className="absolute inset-0">
              <LeafletMap
                center={mapCenter}
                zoom={mapZoom}
                userLocation={userLocation}
                doctors={filteredDoctors}
                onSelectDoctor={handleSelectDoctor}
              />
            </div>
          </CardContent>
        </Card>

        {/* Doctor List */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-none">
            <CardTitle>Doctors List</CardTitle>
            <CardDescription>Click to view details</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            {loading ? (
              <div className="h-full flex items-center justify-center p-8 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p>Loading doctors...</p>
                </div>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">No doctors found</p>
                <p className="text-sm">Try adjusting your filters or search area</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery("")
                    setSpecializationFilter("")
                    setAvailabilityFilter("all")
                    setPriceRange([0, 5000])
                    setCity("")
                  }}
                  className="mt-2"
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="h-full overflow-y-auto p-4 space-y-4">
                {filteredDoctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${selectedDoctor?.id === doctor.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:border-primary/50'}`}
                    onClick={() => handleSelectDoctor(doctor)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden border">
                          {doctor.profileImage ? (
                            <img
                              src={doctor.profileImage}
                              alt={`${doctor.firstName} ${doctor.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Stethoscope className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">{doctor.specialization}</p>
                          {doctor.clinicName && (
                            <p className="text-xs flex items-center gap-1 mt-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{doctor.clinicName}</span>
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              ₹{doctor.consultationFee}
                            </Badge>
                            {doctor.distance !== undefined && doctor.distance < 1000 && (
                              <Badge variant="secondary" className="text-xs">
                                {doctor.distance.toFixed(1)} km
                              </Badge>
                            )}
                            {doctor.rating && (
                              <Badge variant="outline" className="text-xs border-yellow-200 bg-yellow-50 text-yellow-700">
                                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                {doctor.rating}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Doctor Profile Modal */}
      <DoctorProfileModal
        doctor={selectedDoctor}
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        userLocation={userLocation}
      />
    </div>
  )
}
