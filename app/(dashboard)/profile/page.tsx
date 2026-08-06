"use client"

export const dynamic = 'force-dynamic'

import type React from "react"

import { useState, useEffect } from "react"
import nextDynamic from "next/dynamic"
import { useAppSelector, useAppDispatch } from "@/app/hooks"
import { userService } from "@/services/user.service"
import { apiService } from "@/services/api"
import { setUser } from "@/app/features/authSlice"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageCropper } from "@/components/ui/image-cropper"
import { Label } from "@/components/ui/label"
import { Camera, Save, Wallet, Building2, CreditCard, MapPin, Coffee, X, Crosshair, Clock, Check, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { IndiaStateNativeSelect, IndiaCityNativeSelect } from "@/components/location/IndiaLocationFields"
import { geocodeClinicLocation, getCurrentDeviceLocation } from "@/lib/geocodeClinic"

const DEFAULT_WORKING_HOURS: Record<string, { start: string; end: string; isOpen: boolean; breakStart: string; breakEnd: string }> = {
  monday: { start: "09:00", end: "17:00", isOpen: true, breakStart: "", breakEnd: "" },
  tuesday: { start: "09:00", end: "17:00", isOpen: true, breakStart: "", breakEnd: "" },
  wednesday: { start: "09:00", end: "17:00", isOpen: true, breakStart: "", breakEnd: "" },
  thursday: { start: "09:00", end: "17:00", isOpen: true, breakStart: "", breakEnd: "" },
  friday: { start: "09:00", end: "17:00", isOpen: true, breakStart: "", breakEnd: "" },
  saturday: { start: "09:00", end: "13:00", isOpen: false, breakStart: "", breakEnd: "" },
  sunday: { start: "", end: "", isOpen: false, breakStart: "", breakEnd: "" },
}

// Dynamically import the Leaflet map with SSR disabled (Leaflet needs the browser)
const LocationPickerMap = nextDynamic(() => import("@/components/onboarding/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full rounded-xl border border-border bg-muted/30 animate-pulse flex items-center justify-center text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
})

export default function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user)
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [formHydrated, setFormHydrated] = useState(false)

  // Parse existing address or use default
  const parseAddress = (fullAddress: string) => {
    if (!fullAddress) return { line: "", city: "", state: "", pincode: "" }
    // Try to parse format: "Line, City, State - Pincode" or "Line, City, State, Pincode"
    const parts = fullAddress.split(",").map(p => p.trim())
    if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1]
      let state = lastPart
      let pincode = ""

      if (lastPart.includes("-")) {
        const statePin = lastPart.split("-").map(p => p.trim())
        state = statePin[0]
        pincode = statePin[1] || ""
      } else if (/^\d{5,6}$/.test(lastPart)) {
        pincode = lastPart
        state = parts[parts.length - 2] || ""
        return {
          line: parts.slice(0, parts.length - 2).join(", "),
          city: parts[parts.length - 3] || "",
          state,
          pincode,
        }
      }

      return {
        line: parts.slice(0, parts.length - 2).join(", "),
        city: parts[parts.length - 2],
        state: state,
        pincode: pincode
      }
    }
    return { line: fullAddress, city: "", state: "", pincode: "" }
  }

  const isDoctor = user?.role === "doctor"
  const canManage = (user as any)?.canManageSubscription === true
  const dp = (user as any)?.doctorProfile

  const toDateInputValue = (value?: string | Date | null) => {
    if (!value) return ""
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10)
    return d.toISOString().slice(0, 10)
  }

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    bankAccountDetails: "",
    upiId: "",
  })

  // Hydrate personal fields once user is available (auth loads async)
  useEffect(() => {
    if (!user?.id || formHydrated) return
    const addr = parseAddress(((user as any)?.doctorProfile?.clinicAddress as string) || "")
    const profile = (user as any)?.doctorProfile
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      dateOfBirth: toDateInputValue(user.dateOfBirth as any),
      addressLine: addr.line,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      bankAccountDetails: profile?.bankAccountDetails || "",
      upiId: profile?.upiId || "",
    })
    if (profile?.clinicLatitude != null) setClinicLatitude(String(profile.clinicLatitude))
    if (profile?.clinicLongitude != null) setClinicLongitude(String(profile.clinicLongitude))
    if (profile?.workingHours) {
      setWorkingHours(loadWorkingHours(profile.workingHours))
      setInitializedHours(true)
    }
    setFormHydrated(true)
  }, [user?.id, formHydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Doctor working hours (with daily break) ---
  const loadWorkingHours = (wh: any) => {
    const loaded: Record<string, { start: string; end: string; isOpen: boolean; breakStart: string; breakEnd: string }> = {}
    for (const [day, defaults] of Object.entries(DEFAULT_WORKING_HOURS)) {
      const savedDay = wh?.[day]
      loaded[day] = {
        start: savedDay?.start ?? defaults.start,
        end: savedDay?.end ?? defaults.end,
        isOpen: savedDay?.isOpen !== false,
        breakStart: savedDay?.breakStart || "",
        breakEnd: savedDay?.breakEnd || "",
      }
    }
    return loaded
  }

  const [workingHours, setWorkingHours] = useState(DEFAULT_WORKING_HOURS)
  const [clinicLatitude, setClinicLatitude] = useState("")
  const [clinicLongitude, setClinicLongitude] = useState("")
  const [verifyingLocation, setVerifyingLocation] = useState(false)
  const [resolvedClinicId, setResolvedClinicId] = useState<string | undefined>(user?.clinicId)
  const [clinicAddressLoaded, setClinicAddressLoaded] = useState(false)
  const [initializedHours, setInitializedHours] = useState(false)

  // Load clinic address from Clinic table once (source of truth for Clinic Information)
  useEffect(() => {
    if (!isDoctor || !canManage || !formHydrated || clinicAddressLoaded) return
    let cancelled = false

    const loadClinicAddress = async () => {
      try {
        let clinic: any = null
        let id = user?.clinicId

        if (id) {
          try {
            clinic = await apiService.get(`/clinics/${id}`)
          } catch {
            clinic = null
          }
        }

        if (!clinic) {
          try {
            clinic = await apiService.get("/clinics/mine")
            id = clinic?.id
          } catch {
            clinic = null
          }
        }

        if (cancelled) return
        setClinicAddressLoaded(true)
        if (!clinic) return

        if (id) setResolvedClinicId(id)

        setFormData((prev) => ({
          ...prev,
          addressLine: clinic.address || prev.addressLine,
          city: clinic.city || prev.city,
          state: clinic.state || prev.state,
          pincode: clinic.zipCode || prev.pincode,
        }))

        if (clinic.latitude != null) setClinicLatitude(String(clinic.latitude))
        if (clinic.longitude != null) setClinicLongitude(String(clinic.longitude))

        if (id && user && user.clinicId !== id) {
          dispatch(setUser({ ...user, clinicId: id }))
        }
      } catch (error) {
        console.warn("Failed to load clinic address for profile:", error)
        if (!cancelled) setClinicAddressLoaded(true)
      }
    }

    loadClinicAddress()
    return () => {
      cancelled = true
    }
  }, [isDoctor, canManage, formHydrated, clinicAddressLoaded, user?.clinicId]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateWorkingHours = (day: string, patch: Partial<{ start: string; end: string; isOpen: boolean; breakStart: string; breakEnd: string }>) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...patch },
    }))
  }

  // If the doctor changes the address after pinning, invalidate the pinned location
  // so they re-verify instead of keeping a stale pin.
  const updateAddress = (patch: Partial<typeof formData>) => {
    setFormData({ ...formData, ...patch })
    setClinicLatitude("")
    setClinicLongitude("")
  }

  const handleVerifyLocation = async () => {
    if (!formData.addressLine?.trim() && !formData.city?.trim()) {
      toast({
        title: "Error",
        description: "Please enter the clinic address and city first",
        variant: "destructive",
      })
      return
    }
    setVerifyingLocation(true)
    try {
      const location = await geocodeClinicLocation({
        address: formData.addressLine,
        city: formData.city,
        state: formData.state,
        zipCode: formData.pincode,
        country: "India",
      })
      setClinicLatitude(location.lat.toString())
      setClinicLongitude(location.lng.toString())
      toast({
        title: "Success",
        description: location.approximate
          ? "Approximate location set — drag the pin to your exact clinic, then save."
          : "Location found! Drag the pin to fine-tune, then save.",
      })
    } catch (error) {
      console.error("Geocoding error:", error)
      toast({
        title: "Error",
        description: "Failed to verify location. Try again or use your current location.",
        variant: "destructive",
      })
    } finally {
      setVerifyingLocation(false)
    }
  }

  const handleUseCurrentLocation = async () => {
    setVerifyingLocation(true)
    try {
      const location = await getCurrentDeviceLocation()
      setClinicLatitude(location.lat.toString())
      setClinicLongitude(location.lng.toString())
      toast({
        title: "Success",
        description: "Using your current location — drag the pin to the exact clinic spot, then save.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Could not access your current location. Allow location permission and try again.",
        variant: "destructive",
      })
    } finally {
      setVerifyingLocation(false)
    }
  }

  // Indian states/cities come from shared indianLocations helpers

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setSaved(false)

      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        toast({ title: "Error", description: "First name and last name are required", variant: "destructive" })
        setLoading(false)
        return
      }

      const street = (formData.addressLine || "").trim()
      const city = (formData.city || "").trim()
      const state = (formData.state || "").trim()
      const zipCode = (formData.pincode || "").trim()
      const fullClinicAddress = [street, city, state, zipCode].filter(Boolean).join(", ")

      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
      }

      if (isDoctor) {
        if (canManage) {
          payload.clinicAddress = fullClinicAddress
          payload.clinicStreet = street
          payload.clinicCity = city
          payload.clinicState = state
          payload.clinicZipCode = zipCode
          payload.clinicCountry = "India"
        }

        const existingWh = (user as any)?.doctorProfile?.workingHours || {}
        payload.workingHours = {
          ...(existingWh?.exceptions ? { exceptions: existingWh.exceptions } : {}),
          ...(existingWh?.defaultSettings ? { defaultSettings: existingWh.defaultSettings } : {}),
          ...workingHours,
        }

        const lat = clinicLatitude ? parseFloat(clinicLatitude) : NaN
        const lng = clinicLongitude ? parseFloat(clinicLongitude) : NaN
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          payload.clinicLatitude = lat
          payload.clinicLongitude = lng
        } else if (dp?.clinicLatitude != null || dp?.clinicLongitude != null) {
          payload.clinicLatitude = null
          payload.clinicLongitude = null
        }

        payload.bankAccountDetails = formData.bankAccountDetails?.trim() || null
        payload.upiId = formData.upiId?.trim() || null
      }

      if (formData.dateOfBirth) {
        const dateObj = new Date(formData.dateOfBirth)
        if (!isNaN(dateObj.getTime())) {
          payload.dateOfBirth = dateObj.toISOString()
        }
      }

      // 1) Save profile (backend also syncs Clinic when possible)
      const response: any = await userService.updateProfile(payload)

      // 2) Explicit clinic sync so Clinic Information stays correct
      let clinicId =
        resolvedClinicId ||
        (user as any)?.clinicId ||
        (response as any)?.clinicId

      let clinicSynced = false
      if (isDoctor && canManage && street && city) {
        try {
          if (!clinicId) {
            try {
              const mine: any = await apiService.get("/clinics/mine")
              clinicId = mine?.id
            } catch {
              clinicId = undefined
            }
          }

          if (clinicId) {
            const clinicPayload: Record<string, unknown> = {
              address: street,
              city,
              country: "India",
            }
            if (state) clinicPayload.state = state
            if (zipCode) clinicPayload.zipCode = zipCode
            if (payload.clinicLatitude !== undefined) clinicPayload.latitude = payload.clinicLatitude
            if (payload.clinicLongitude !== undefined) clinicPayload.longitude = payload.clinicLongitude

            await apiService.put(`/clinics/${clinicId}`, clinicPayload)
            clinicSynced = true
            setResolvedClinicId(clinicId)

            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("pulsecal:clinic-updated", { detail: { clinicId } })
              )
            }
          }
        } catch (clinicSyncError: any) {
          console.error("Clinic table sync after profile save failed:", clinicSyncError)
        }
      }

      // 3) Refresh from server so Redux matches DB
      let refreshed: any = response
      try {
        refreshed = await apiService.get("/auth/profile")
      } catch {
        refreshed = response
      }

      const optimisticUser = {
        ...user,
        ...refreshed,
        id: user?.id || refreshed?.id,
        role: (refreshed?.role || user?.role || "doctor").toString().toLowerCase(),
        clinicId: clinicId || refreshed?.clinicId || user?.clinicId,
        canManageSubscription:
          refreshed?.canManageSubscription ?? (user as any)?.canManageSubscription,
        ...(isDoctor
          ? {
              doctorProfile: {
                ...(user as any)?.doctorProfile,
                ...(refreshed as any)?.doctorProfile,
                clinicAddress:
                  fullClinicAddress ||
                  (refreshed as any)?.doctorProfile?.clinicAddress ||
                  (user as any)?.doctorProfile?.clinicAddress,
                workingHours:
                  payload.workingHours ||
                  (refreshed as any)?.doctorProfile?.workingHours,
                clinicLatitude:
                  payload.clinicLatitude !== undefined
                    ? payload.clinicLatitude
                    : (refreshed as any)?.doctorProfile?.clinicLatitude,
                clinicLongitude:
                  payload.clinicLongitude !== undefined
                    ? payload.clinicLongitude
                    : (refreshed as any)?.doctorProfile?.clinicLongitude,
                bankAccountDetails:
                  payload.bankAccountDetails ??
                  formData.bankAccountDetails ??
                  (refreshed as any)?.doctorProfile?.bankAccountDetails,
                upiId:
                  payload.upiId ??
                  formData.upiId ??
                  (refreshed as any)?.doctorProfile?.upiId,
              },
            }
          : {}),
      }

      dispatch(setUser(optimisticUser as any))
      setSaved(true)
      toast({
        title: "Saved",
        description: "Profile information updated successfully",
      })
      window.setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      console.error("Profile update error - Full error:", error)
      console.error("Error response:", error.response)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to update profile"
      toast({
        title: "Error",
        description: `Failed to update profile: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setLoading(true)
      // Create a File object from the Blob
      const file = new File([croppedBlob], "profile-picture.jpg", { type: "image/jpeg" })

      const uploadResponse = await userService.uploadProfilePicture(file)

      if (!uploadResponse?.url) {
        throw new Error("Upload failed - No URL returned")
      }

      const updatedUser = await userService.updateProfile({ profileImage: uploadResponse.url })

      dispatch(setUser(updatedUser))

      // Double check persistence by fetching fresh profile
      const freshProfile = await userService.getProfile()
      if (freshProfile.profileImage !== uploadResponse.url) {
        // Force update Redux with fresh profile just in case
        dispatch(setUser(freshProfile))
      }

      toast({ title: "Success", description: "Profile picture updated successfully" })
      setSelectedImage(null)
    } catch (error: any) {
      console.error("Profile picture upload error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your personal information</p>
        </div>
        <Link href="/profile/security">
          <Button variant="outline">Security Settings</Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {user?.profileImage ? (
                <img
                  src={user.profileImage || "/placeholder.svg"}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-semibold text-primary">{user?.firstName?.charAt(0)}</span>
              )}
            </div>
            <label
              htmlFor="profile-picture"
              className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
            >
              <Camera className="h-4 w-4" />
              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={loading}
              />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>

        <ImageCropper
          imageSrc={selectedImage}
          open={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          onCropComplete={handleCropComplete}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
          </div>



          {isDoctor && canManage && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Clinic Address</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <IndiaStateNativeSelect
                    id="state"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.state}
                    onChange={(state) => updateAddress({ state, city: "" })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <IndiaCityNativeSelect
                    id="city"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    state={formData.state}
                    value={formData.city}
                    onChange={(city) => updateAddress({ city })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine">Address Line</Label>
                <Input
                  id="addressLine"
                  value={formData.addressLine}
                  onChange={(e) => updateAddress({ addressLine: e.target.value })}
                  placeholder="Street address, building, suite"
                />
              </div>

              <div className="space-y-2 md:w-1/3">
                <Label htmlFor="pincode">Pin Code</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => updateAddress({ pincode: e.target.value })}
                  placeholder="e.g. 400001"
                />
              </div>
            </div>
          )}

          {isDoctor && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Working Hours & Break
              </h3>
              <p className="text-sm text-muted-foreground">
                Set your available hours for each day. Patients won&apos;t be able to book during your break.
              </p>
              <div className="space-y-3">
                {Object.entries(workingHours).map(([day, hours]) => (
                  <div key={day} className="flex flex-col gap-2 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={hours.isOpen}
                        onChange={(e) => updateWorkingHours(day, { isOpen: e.target.checked })}
                        className="rounded w-4 h-4"
                      />
                      <Label className="capitalize font-medium w-24">{day}</Label>
                      {!hours.isOpen && <span className="text-sm text-muted-foreground">Closed</span>}
                    </div>
                    {hours.isOpen && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Input
                            type="time"
                            value={hours.start}
                            onChange={(e) => updateWorkingHours(day, { start: e.target.value })}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={hours.end}
                            onChange={(e) => updateWorkingHours(day, { end: e.target.value })}
                            className="w-32"
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground w-14 shrink-0">
                            <Coffee className="h-3.5 w-3.5" />
                            Break
                          </span>
                          <Input
                            type="time"
                            value={hours.breakStart}
                            onChange={(e) => updateWorkingHours(day, { breakStart: e.target.value })}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={hours.breakEnd}
                            onChange={(e) => updateWorkingHours(day, { breakEnd: e.target.value })}
                            className="w-32"
                          />
                          {(hours.breakStart || hours.breakEnd) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-muted-foreground"
                              onClick={() => updateWorkingHours(day, { breakStart: "", breakEnd: "" })}
                              title="Clear break"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        {hours.breakStart && hours.breakEnd &&
                          (hours.breakStart >= hours.breakEnd ||
                            hours.breakStart < hours.start ||
                            hours.breakEnd > hours.end) && (
                          <p className="text-[11px] text-red-500">
                            Break must be within working hours and start before it ends.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isDoctor && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Clinic Location
              </h3>
              <p className="text-sm text-muted-foreground">
                Pin your clinic on the map so patients can find you and get directions.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  readOnly
                  placeholder="Click to pin your clinic on the map"
                  value={
                    clinicLatitude && clinicLongitude
                      ? `Pinned ✓ (${parseFloat(clinicLatitude).toFixed(5)}, ${parseFloat(clinicLongitude).toFixed(5)})`
                      : "No location pinned yet"
                  }
                  className="flex-1"
                />
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVerifyLocation}
                    disabled={verifyingLocation}
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
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleUseCurrentLocation}
                    disabled={verifyingLocation}
                    title="Use your device GPS"
                  >
                    <MapPin className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Use my location</span>
                  </Button>
                </div>
              </div>
              {clinicLatitude && clinicLongitude && (
                <div className="space-y-2">
                  <LocationPickerMap
                    latitude={parseFloat(clinicLatitude)}
                    longitude={parseFloat(clinicLongitude)}
                    onLocationChange={(lat, lng) => {
                      setClinicLatitude(lat.toString())
                      setClinicLongitude(lng.toString())
                      toast({ title: "Success", description: "Clinic location updated" })
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Drag the pin to the exact clinic location, then save your changes.
                  </p>
                </div>
              )}
            </div>
          )}

          {isDoctor && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Payout Details
              </h3>
              <p className="text-sm text-muted-foreground">
                Add your bank account details or UPI ID to receive payments every 15 days. You can provide either one.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankAccountDetails" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Bank Account Details
                  </Label>
                  <Input
                    id="bankAccountDetails"
                    value={formData.bankAccountDetails}
                    onChange={(e) => setFormData({ ...formData, bankAccountDetails: e.target.value })}
                    placeholder="Bank name, Account number, IFSC, Account holder name"
                  />
                  <p className="text-xs text-muted-foreground">
                    e.g. HDFC Bank, A/c 1234567890, IFSC HDFC0001234, John Doe
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upiId" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    UPI ID
                  </Label>
                  <Input
                    id="upiId"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="yourname@upi or 9876543210@paytm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide UPI ID if you prefer UPI over bank transfer
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
