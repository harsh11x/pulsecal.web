"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, Navigation, Stethoscope, Clock, DollarSign, Star, Filter, X } from "lucide-react"
import { apiService } from "@/services/api"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { DoctorProfileModal } from "./DoctorProfileModal"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [specializationFilter, setSpecializationFilter] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available">("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [radius, setRadius] = useState([10]) // km
  const [showFilters, setShowFilters] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)

  const specializations = [
    "All Specializations",
    "General Practice",
    "Cardiology",
    "Dermatology",
    "Endocrinology",
    "Gastroenterology",
    "Neurology",
    "Oncology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "Pulmonology",
    "Urology",
  ]

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          toast.error("Could not get your location. Please enable location services.")
        }
      )
    }

    // Initialize Google Maps
    const initMap = () => {
      if (window.google && mapRef.current) {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: userLocation || { lat: 40.7128, lng: -74.006 },
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        })
        setMap(mapInstance)
      } else {
        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = () => {
          if (mapRef.current) {
            const mapInstance = new window.google.maps.Map(mapRef.current, {
              center: userLocation || { lat: 40.7128, lng: -74.006 },
              zoom: 12,
            })
            setMap(mapInstance)
          }
        }
        document.head.appendChild(script)
      }
    }

    initMap()
  }, [])

  useEffect(() => {
    if (userLocation) {
      fetchDoctors()
    }
  }, [userLocation, radius])

  useEffect(() => {
    filterDoctors()
  }, [doctors, searchQuery, specializationFilter, availabilityFilter, priceRange])

  useEffect(() => {
    if (map && filteredDoctors.length > 0) {
      updateMapMarkers()
    }
  }, [map, filteredDoctors, userLocation])

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

      const response: any = await apiService.get("/api/v1/doctors/search", { params })
      let doctorsData = response?.data || response || []

      // Calculate distances if user location is available
      if (userLocation) {
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
          return doctor
        })
        doctorsData.sort((a: Doctor, b: Doctor) => (a.distance || Infinity) - (b.distance || Infinity))
      }

      setDoctors(doctorsData)
    } catch (error: any) {
      console.error("Failed to fetch doctors:", error)
      // Use mock data if backend is unavailable
      setDoctors(getMockDoctors())
    } finally {
      setLoading(false)
    }
  }

  const getMockDoctors = (): Doctor[] => {
    return [
      {
        id: "1",
        firstName: "John",
        lastName: "Smith",
        specialization: "Cardiology",
        clinicName: "Heart Care Clinic",
        clinicAddress: "123 Medical Center Dr",
        clinicCity: "New York",
        clinicLatitude: 40.7128,
        clinicLongitude: -74.006,
        consultationFee: 150,
        rating: 4.8,
        totalReviews: 124,
        distance: 2.5,
        isAvailable: true,
        services: ["Consultation", "ECG", "Echocardiogram"],
      },
      {
        id: "2",
        firstName: "Sarah",
        lastName: "Johnson",
        specialization: "Dermatology",
        clinicName: "Skin Health Center",
        clinicAddress: "456 Health Ave",
        clinicCity: "New York",
        clinicLatitude: 40.7589,
        clinicLongitude: -73.9851,
        consultationFee: 120,
        rating: 4.9,
        totalReviews: 89,
        distance: 5.2,
        isAvailable: true,
        services: ["Consultation", "Skin Analysis", "Treatment"],
      },
    ]
  }

  const filterDoctors = () => {
    let filtered = [...doctors]

    // Filter by search query
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

    // Filter by specialization
    if (specializationFilter && specializationFilter !== "All Specializations") {
      filtered = filtered.filter((doctor) => doctor.specialization === specializationFilter)
    }

    // Filter by availability
    if (availabilityFilter === "available") {
      filtered = filtered.filter((doctor) => doctor.isAvailable)
    }

    // Filter by price range
    filtered = filtered.filter(
      (doctor) => doctor.consultationFee >= priceRange[0] && doctor.consultationFee <= priceRange[1]
    )

    // Filter by radius
    if (userLocation) {
      filtered = filtered.filter((doctor) => {
        if (!doctor.distance) return false
        return doctor.distance <= radius[0]
      })
    }

    setFilteredDoctors(filtered)
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radius of the Earth in km
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

  const updateMapMarkers = () => {
    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null))
    const newMarkers: any[] = []

    filteredDoctors.forEach((doctor) => {
      if (doctor.clinicLatitude && doctor.clinicLongitude && map) {
        const marker = new window.google.maps.Marker({
          position: { lat: doctor.clinicLatitude, lng: doctor.clinicLongitude },
          map: map,
          title: `${doctor.firstName} ${doctor.lastName} - ${doctor.clinicName}`,
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new window.google.maps.Size(32, 32),
          },
        })

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-3 min-w-[200px]">
              <h3 class="font-bold text-lg">${doctor.firstName} ${doctor.lastName}</h3>
              <p class="text-sm text-gray-600">${doctor.specialization}</p>
              <p class="text-sm font-medium">${doctor.clinicName}</p>
              <p class="text-sm">$${doctor.consultationFee}</p>
              ${doctor.distance ? `<p class="text-xs text-gray-500 mt-1">${doctor.distance.toFixed(1)} km away</p>` : ""}
              <button onclick="window.selectDoctor('${doctor.id}')" class="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">
                View Details
              </button>
            </div>
          `,
        })

        marker.addListener("click", () => {
          infoWindow.open(map, marker)
          setSelectedDoctor(doctor)
        })

        newMarkers.push(marker)
      }
    })

    // Add user location marker
    if (userLocation && map) {
      const userMarker = new window.google.maps.Marker({
        position: userLocation,
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        title: "Your Location",
      })
      newMarkers.push(userMarker)
    }

    setMarkers(newMarkers)

    // Fit bounds to show all markers
    if (filteredDoctors.length > 0 && map) {
      const bounds = new window.google.maps.LatLngBounds()
      filteredDoctors.forEach((doctor) => {
        if (doctor.clinicLatitude && doctor.clinicLongitude) {
          bounds.extend({
            lat: doctor.clinicLatitude,
            lng: doctor.clinicLongitude,
          })
        }
      })
      if (userLocation) {
        bounds.extend(userLocation)
      }
      map.fitBounds(bounds)
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
                      setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                      })
                      fetchDoctors()
                    }
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
                <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
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
            <div ref={mapRef} className="w-full h-[600px] rounded-lg border" />
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
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {doctor.profileImage ? (
                            <img
                              src={doctor.profileImage}
                              alt={`${doctor.firstName} ${doctor.lastName}`}
                              className="w-full h-full rounded-full object-cover"
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
                              <DollarSign className="h-3 w-3" />
                              ${doctor.consultationFee}
                            </Badge>
                            {doctor.distance && (
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

