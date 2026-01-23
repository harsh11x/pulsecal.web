"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
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
  const [specializationFilter, setSpecializationFilter] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available">("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000])
  const [radius, setRadius] = useState([50]) // km
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
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter([latitude, longitude]);
          setMapZoom(12);
        },
        (error) => {
          console.error("Error getting location:", error)
          toast.error("Could not get your location. Defaulting to India view.")
        }
      )
    }

    // Initial fetch
    fetchDoctors();
  }, [])

  useEffect(() => {
    if (userLocation) {
      fetchDoctors()
    }
  }, [userLocation, radius])

  useEffect(() => {
    filterDoctors()
  }, [doctors, searchQuery, specializationFilter, availabilityFilter, priceRange])

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (userLocation) {
        params.latitude = userLocation.lat
        params.longitude = userLocation.lng
        params.radius = radius[0] * 1000 // Convert km to meters
      }

      if (specializationFilter && specializationFilter !== "All Specializations") {
        params.specialization = specializationFilter
      }

      try {
          const response: any = await apiService.get("/api/v1/doctors/search", { params })
          let doctorsData = response?.data?.doctors || response?.data || response || []

          if (!Array.isArray(doctorsData)) {
              doctorsData = [];
          }

          if (userLocation && doctorsData.length > 0) {
            doctorsData = doctorsData.map((doctor: Doctor) => {
              if (doctor.clinicLatitude && doctor.clinicLongitude) {
                const distance = calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  doctor.clinicLatitude,
                  doctor.clinicLongitude
                )
                return { ...doctor, distance }
              }
              return { ...doctor, distance: 9999 }
            })
            doctorsData.sort((a: Doctor, b: Doctor) => (a.distance || Infinity) - (b.distance || Infinity))
          }

          setDoctors(doctorsData)
      } catch (apiError) {
          console.warn("API Search failed, trying fallback list or empty:", apiError);
          setDoctors([]);
      }

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

    if (userLocation) {
      filtered = filtered.filter((doctor) => {
        if (!doctor.distance) return false
        return doctor.distance <= radius[0]
      })
    }

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

          {userLocation && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Search Radius: {radius[0]} km</Label>
              <Slider
                value={radius}
                onValueChange={setRadius}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 km</span>
                <span>25 km</span>
                <span>50 km</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Map */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Map View</CardTitle>
            <CardDescription>
              {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[600px] rounded-lg border overflow-hidden relative z-0">
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
        <Card>
          <CardHeader>
            <CardTitle>Doctors List</CardTitle>
            <CardDescription>Click to view details</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading doctors...</div>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No doctors found. Try adjusting your filters.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredDoctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${selectedDoctor?.id === doctor.id ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => handleSelectDoctor(doctor)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                            {doctor.firstName} {doctor.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">{doctor.specialization}</p>
                          {doctor.clinicName && (
                            <p className="text-xs flex items-center gap-1 mt-1">
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
                              <Badge variant="outline" className="text-xs">
                                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                {doctor.rating}
                              </Badge>
                            )}
                            {doctor.isAvailable && (
                              <Badge className="bg-green-500 text-xs">Available</Badge>
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
