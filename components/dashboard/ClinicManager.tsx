"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Save, Loader2, MapPin, Crosshair } from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import { Clinic } from "@/types"

import { useAppSelector } from "@/app/hooks"

// Dynamically import the Leaflet map with SSR disabled (Leaflet needs the browser)
const LocationPickerMap = dynamic(() => import("@/components/onboarding/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full rounded-xl border border-border bg-muted/30 animate-pulse flex items-center justify-center text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
})

interface ClinicManagerProps {
    clinicId: string
}

export default function ClinicManager({ clinicId }: ClinicManagerProps) {
    const { user } = useAppSelector((state) => state.auth)
    // Head doctor has canManageSubscription=true (usually) or check if they are the creator. 
    // Simplified: Role based check or specific flag. 
    // The requirement: "Only head doctor can see ... Edit Clinic".
    // If this component renders the edit form, we should check permission.
    const canEdit = user?.role === "admin" || (user?.role === "doctor" && (user as any)?.canManageSubscription === true)

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [verifyingLocation, setVerifyingLocation] = useState(false)
    const [showMap, setShowMap] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        phone: "",
        email: "",
        latitude: "",
        longitude: ""
    })

    useEffect(() => {
        if (clinicId) {
            fetchClinicDetails()
        } else {
            setFetching(false)
        }
    }, [clinicId])

    const fetchClinicDetails = async () => {
        try {
            const response: any = await apiService.get(`/clinics/${clinicId}`)
            const clinic = response

            if (clinic) {
                setFormData({
                    name: clinic.name || "",
                    address: clinic.address || "",
                    city: clinic.city || "",
                    state: clinic.state || "",
                    zipCode: clinic.zipCode || "",
                    country: clinic.country || "",
                    phone: clinic.phone || "",
                    email: clinic.email || "",
                    latitude: clinic.latitude != null ? String(clinic.latitude) : "",
                    longitude: clinic.longitude != null ? String(clinic.longitude) : ""
                })
                if (clinic.latitude != null && clinic.longitude != null) {
                    setShowMap(true)
                }
            }
        } catch (error) {
            console.warn("Failed to fetch clinic details:", error)
            toast.error("Failed to load clinic details")
        } finally {
            setFetching(false)
        }
    }

    const handleVerifyLocation = async () => {
        if (!formData.address || !formData.city) {
            toast.error("Please enter the clinic address and city first")
            return
        }
        setVerifyingLocation(true)
        try {
            const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}`
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            )
            const data = await response.json()
            if (data.results && data.results.length > 0) {
                const location = data.results[0].geometry.location
                setFormData({
                    ...formData,
                    latitude: location.lat.toString(),
                    longitude: location.lng.toString(),
                })
                setShowMap(true)
                toast.success("Location found! Drag the pin to fine-tune, then save.")
            } else {
                toast.error("Could not find the address. Please check it and try again.")
            }
        } catch (error) {
            console.error("Geocoding error:", error)
            toast.error("Failed to verify location. Try again later.")
        } finally {
            setVerifyingLocation(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canEdit) {
            toast.error("You do not have permission to edit clinic details")
            return
        }

        if (!clinicId) {
            toast.error("Clinic ID is missing")
            return
        }
        setLoading(true)

        try {
            const payload: Record<string, unknown> = {
                ...formData,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            }
            console.log("Updating clinic details:", payload)
            const response = await apiService.put(`/clinics/${clinicId}`, payload)
            console.log("Update response:", response)

            // Keep the doctor discovery map in sync by updating the owner's profile coordinates too
            if (payload.latitude != null && payload.longitude != null) {
                try {
                    await apiService.put("/doctor-profiles/me", {
                        clinicLatitude: payload.latitude,
                        clinicLongitude: payload.longitude,
                    })
                } catch (syncError) {
                    console.warn("Failed to sync doctor profile location:", syncError)
                }
            }

            toast.success("Clinic details updated successfully")
        } catch (error: any) {
            console.error("Failed to update clinic:", error)
            const errorMessage = error.response?.data?.message || error.message || "Failed to update clinic details"
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
    }

    if (!canEdit) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Clinic Information</CardTitle>
                    <CardDescription>View clinic details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-muted-foreground">Clinic Name</Label>
                            <p className="font-medium">{formData.name}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Phone</Label>
                            <p className="font-medium">{formData.phone || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Email</Label>
                            <p className="font-medium">{formData.email || "N/A"}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Address</Label>
                            <p className="font-medium">
                                {formData.address}<br />
                                {formData.city}, {formData.state} {formData.zipCode}<br />
                                {formData.country}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Clinic Information</CardTitle>
                <CardDescription>Manage your clinic's public details and contact information</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Clinic Name</Label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="name"
                                className="pl-9"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="address"
                                className="pl-9"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                                id="state"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="zipCode">Zip Code</Label>
                            <Input
                                id="zipCode"
                                value={formData.zipCode}
                                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                                id="country"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Clinic Location on Map</Label>
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                placeholder="Click to pin your clinic on the map"
                                value={
                                    formData.latitude && formData.longitude
                                        ? `Pinned ✓ (${parseFloat(formData.latitude).toFixed(5)}, ${parseFloat(formData.longitude).toFixed(5)})`
                                        : "No location pinned yet"
                                }
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleVerifyLocation}
                                disabled={verifyingLocation || !formData.address || !formData.city}
                            >
                                {verifyingLocation ? (
                                    "Locating..."
                                ) : (
                                    <>
                                        <Crosshair className="h-4 w-4 mr-2" />
                                        Set Location on Map
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Pin your clinic on the map so patients can find you and get directions
                        </p>

                        {showMap && formData.latitude && formData.longitude && (
                            <div className="space-y-2 pt-2">
                                <LocationPickerMap
                                    latitude={parseFloat(formData.latitude)}
                                    longitude={parseFloat(formData.longitude)}
                                    onLocationChange={(lat, lng) => {
                                        setFormData({
                                            ...formData,
                                            latitude: lat.toString(),
                                            longitude: lng.toString(),
                                        })
                                        toast.success("Clinic location updated")
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Drag the pin to the exact clinic location, then save your changes.
                                </p>
                            </div>
                        )}
                    </div>

                    <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Update Information
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
