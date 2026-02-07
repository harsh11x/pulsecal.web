"use client"

export const dynamic = 'force-dynamic'

import type React from "react"

import { useState } from "react"
import { useAppSelector, useAppDispatch } from "@/app/hooks"
import { userService } from "@/services/user.service"
import { setUser } from "@/app/features/authSlice"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Save, Wallet, Building2, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

import { State, City } from "country-state-city"

export default function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user)
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Parse existing address or use default
  const parseAddress = (fullAddress: string) => {
    if (!fullAddress) return { line: "", city: "", state: "", pincode: "" }
    // Try to parse format: "Line, City, State - Pincode"
    const parts = fullAddress.split(",").map(p => p.trim())
    if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1] // "State - Pincode" or just State?
      let state = lastPart
      let pincode = ""

      if (lastPart.includes("-")) {
        const statePin = lastPart.split("-").map(p => p.trim())
        state = statePin[0]
        pincode = statePin[1]
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

  const isDoctor = user?.role === "DOCTOR"
  const existingAddress = isDoctor ? ((user as any)?.doctorProfile?.clinicAddress || "") : ""
  const parsed = parseAddress(existingAddress)
  const dp = (user as any)?.doctorProfile

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    dateOfBirth: user?.dateOfBirth || "",
    addressLine: parsed.line,
    city: parsed.city,
    state: parsed.state,
    pincode: parsed.pincode,
    bankAccountDetails: dp?.bankAccountDetails || "",
    upiId: dp?.upiId || "",
  })

  // Get Indian states
  const states = State.getStatesOfCountry("IN")
  // Get cities based on selected state
  const cities = formData.state
    ? City.getCitiesOfState("IN", states.find(s => s.name === formData.state)?.isoCode || "")
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)

      // Construct full address string
      const parts = [formData.addressLine, formData.city, formData.state].filter(Boolean);
      const suffix = formData.pincode ? ` - ${formData.pincode}` : '';
      const fullClinicAddress = parts.length > 0 ? parts.join(", ") + suffix : "";

      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      }
      if (isDoctor) {
        payload.clinicAddress = fullClinicAddress
        payload.bankAccountDetails = formData.bankAccountDetails?.trim() || null
        payload.upiId = formData.upiId?.trim() || null
      }
      
      // Only include dateOfBirth if it's provided and valid
      // Backend expects Date object, but Joi will parse ISO string
      if (formData.dateOfBirth) {
        // Convert date string to ISO format for backend
        const dateObj = new Date(formData.dateOfBirth)
        if (!isNaN(dateObj.getTime())) {
          payload.dateOfBirth = dateObj.toISOString()
        }
      }

      console.log("Submitting profile update:", payload)

      // Update profile via API
      const response: any = await userService.updateProfile(payload)
      console.log("Profile update response:", response)
      
      // apiService now unwraps the response, so response should be the user object directly
      const updatedUser = response

      // Optimistic update
      const optimisticUser = {
        ...user,
        ...updatedUser,
        id: user?.id || updatedUser.id,
        role: user?.role || updatedUser.role,
        ...(isDoctor ? {
          doctorProfile: {
            ...(user as any)?.doctorProfile,
            ...(updatedUser as any)?.doctorProfile,
            clinicAddress: fullClinicAddress,
            bankAccountDetails: payload.bankAccountDetails ?? formData.bankAccountDetails,
            upiId: payload.upiId ?? formData.upiId,
          }
        } : {})
      }

      dispatch(setUser(optimisticUser))

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })

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

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... existing logic ...
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setLoading(true)
      const { url } = await userService.uploadProfilePicture(file)
      const updatedUser = await userService.updateProfile({ profileImage: url })
      dispatch(setUser(updatedUser))
      toast({ title: "Success", description: "Profile picture updated successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload profile picture", variant: "destructive" })
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
                onChange={handleProfilePictureUpload}
                disabled={loading}
              />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>

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

          {isDoctor && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Clinic Address</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <select
                  id="state"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value, city: "" })}
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state.isoCode} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <select
                  id="city"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!formData.state}
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine">Address Line</Label>
              <Input
                id="addressLine"
                value={formData.addressLine}
                onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                placeholder="Street address, building, suite"
              />
            </div>

            <div className="space-y-2 md:w-1/3">
              <Label htmlFor="pincode">Pin Code</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="e.g. 400001"
              />
            </div>
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
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
