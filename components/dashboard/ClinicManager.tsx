"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Save, Loader2, MapPin, Crosshair } from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { setUser } from "@/app/features/authSlice"
import type { User } from "@/types"

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
    clinicId?: string
}

export default function ClinicManager({ clinicId: clinicIdProp }: ClinicManagerProps) {
    const dispatch = useAppDispatch()
    const { user } = useAppSelector((state) => state.auth)
    const role = user?.role?.toLowerCase()
    const canEdit = role === "admin" || (role === "doctor" && user?.canManageSubscription === true)

    const [resolvedClinicId, setResolvedClinicId] = useState<string | undefined>(clinicIdProp || user?.clinicId)
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

    const applyClinicToForm = (clinic: any) => {
        if (!clinic) return
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

    const syncClinicIdToRedux = useCallback((id: string) => {
        if (!user || user.clinicId === id) return
        dispatch(setUser({
            ...user,
            clinicId: id,
            role: (user.role || "doctor").toLowerCase() as User["role"],
            canManageSubscription: user.canManageSubscription ?? true,
        }))
    }, [dispatch, user])

    const syncProfileToRedux = useCallback((profile: any, clinicIdFallback?: string) => {
        if (!profile) return
        dispatch(setUser({
            id: profile.id,
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone,
            dateOfBirth: profile.dateOfBirth,
            role: (profile.role || "doctor").toLowerCase() as User["role"],
            isActive: profile.isActive !== false,
            isEmailVerified: profile.isEmailVerified || false,
            profileImage: profile.profileImage,
            onboardingCompleted: profile.onboardingCompleted || false,
            clinicId: profile.clinicId || clinicIdFallback || user?.clinicId,
            ...(profile.doctorProfile && { doctorProfile: profile.doctorProfile }),
            canManageSubscription: profile.canManageSubscription ?? user?.canManageSubscription ?? true,
        }))
    }, [dispatch, user?.clinicId, user?.canManageSubscription])

    const resolveClinicId = useCallback(async (): Promise<string | undefined> => {
        const fromPropOrUser = clinicIdProp || user?.clinicId
        if (fromPropOrUser) {
            setResolvedClinicId(fromPropOrUser)
            return fromPropOrUser
        }

        try {
            const mine: any = await apiService.get("/clinics/mine")
            const id = mine?.id
            if (id) {
                setResolvedClinicId(id)
                syncClinicIdToRedux(id)
                return id
            }
        } catch {
            // fall through to profile refresh
        }

            try {
                const profile: any = await apiService.get("/auth/profile")
                if (profile?.clinicId) {
                    setResolvedClinicId(profile.clinicId)
                    syncProfileToRedux(profile)
                    return profile.clinicId
                }
            } catch (error) {
                console.warn("Failed to resolve clinic id from profile:", error)
            }

        return undefined
    }, [clinicIdProp, user?.clinicId, syncClinicIdToRedux, syncProfileToRedux])

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            setFetching(true)
            try {
                const id = await resolveClinicId()
                if (cancelled) return
                if (id) {
                    const clinic: any = await apiService.get(`/clinics/${id}`)
                    if (!cancelled) applyClinicToForm(clinic)
                }
            } catch (error) {
                console.warn("Failed to fetch clinic details:", error)
                if (!cancelled) toast.error("Failed to load clinic details")
            } finally {
                if (!cancelled) setFetching(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [clinicIdProp, user?.clinicId]) // eslint-disable-line react-hooks/exhaustive-deps

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

        if (!formData.name?.trim() || !formData.address?.trim() || !formData.city?.trim() || !formData.state?.trim() || !formData.zipCode?.trim() || !formData.phone?.trim()) {
            toast.error("Please fill clinic name, address, city, state, zip code, and phone")
            return
        }

        let clinicId = resolvedClinicId || clinicIdProp || user?.clinicId
        if (!clinicId) {
            clinicId = await resolveClinicId()
        }

        setLoading(true)
        try {
            const payload: Record<string, unknown> = {
                name: formData.name.trim(),
                address: formData.address.trim(),
                city: formData.city.trim(),
                state: formData.state.trim(),
                zipCode: formData.zipCode.trim(),
                country: formData.country?.trim() || "India",
                phone: formData.phone.trim(),
                email: formData.email?.trim() || user?.email || undefined,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            }

            // If Redux/profile has no clinic yet (common after payment before onboarding finishes),
            // create the clinic and link it instead of failing with "Clinic ID is missing".
            if (!clinicId) {
                const created: any = await apiService.post("/clinics", payload)
                clinicId = created?.id
                if (!clinicId) {
                    throw new Error("Clinic was created but no ID was returned")
                }
                toast.success("Clinic created successfully")
            } else {
                await apiService.put(`/clinics/${clinicId}`, payload)
                toast.success("Clinic details updated successfully")
            }

            if (payload.latitude != null && payload.longitude != null) {
                try {
                    await apiService.put("/doctor-profiles/me", {
                        clinicName: payload.name,
                        clinicAddress: [payload.address, payload.city, payload.state, payload.zipCode].filter(Boolean).join(", "),
                        clinicLatitude: payload.latitude,
                        clinicLongitude: payload.longitude,
                    })
                } catch (syncError) {
                    console.warn("Failed to sync doctor profile location:", syncError)
                }
            }

            setResolvedClinicId(clinicId)
            try {
                const profile: any = await apiService.get("/auth/profile")
                if (profile) {
                    syncProfileToRedux(profile, clinicId)
                } else {
                    syncClinicIdToRedux(clinicId)
                }
            } catch {
                syncClinicIdToRedux(clinicId)
            }
        } catch (error: any) {
            console.error("Failed to save clinic:", error)
            const errorMessage = error.response?.data?.message || error.message || "Failed to save clinic details"
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
                <CardDescription>
                    {resolvedClinicId || clinicIdProp || user?.clinicId
                        ? "Manage your clinic's public details and contact information"
                        : "No clinic is linked yet — fill in the details below to create and save your clinic"}
                </CardDescription>
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
                                {resolvedClinicId || clinicIdProp || user?.clinicId ? "Update Information" : "Save Clinic"}
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
