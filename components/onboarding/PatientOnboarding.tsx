"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector, useAppDispatch } from "@/app/hooks"
import { setUser } from "@/app/features/authSlice"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import { MapPin, User, Heart, Shield } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function PatientOnboarding() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "pending">("pending")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [formData, setFormData] = useState({
    phone: "",
    dateOfBirth: "",
    bloodType: "",
    allergies: "",
    chronicConditions: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  })

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  useEffect(() => {
    // Request location permission on mount
    requestLocationPermission()
  }, [])

  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationPermission("denied")
      return
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationPermission("granted")
          toast.success("Location access granted! You can now find nearby doctors.")
        },
        (error) => {
          console.error("Location error:", error)
          setLocationPermission("denied")
          toast.warning("Location access denied. You can still search for doctors manually.")
        }
      )
    } catch (error) {
      setLocationPermission("denied")
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    const errors: string[] = []
    
    try {
      // Update user profile - with timeout and error handling
      try {
        const profilePromise = apiService.put("/api/v1/users/profile", {
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address ? `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}` : undefined,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          latitude: userLocation?.lat,
          longitude: userLocation?.lng,
        })
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Request timeout")), 10000)
        )
        await Promise.race([profilePromise, timeoutPromise])
      } catch (profileError: any) {
        console.warn("Profile update warning:", profileError)
        if (profileError.code !== "ERR_NETWORK" && !profileError.message?.includes("timeout")) {
          errors.push("Failed to update profile")
        }
      }

      // Update patient profile - with timeout and error handling
      try {
        const patientPromise = apiService.post("/api/v1/patient-profiles", {
          bloodType: formData.bloodType,
          allergies: formData.allergies,
          chronicConditions: formData.chronicConditions,
        })
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Request timeout")), 10000)
        )
        await Promise.race([patientPromise, timeoutPromise])
      } catch (patientError: any) {
        console.warn("Patient profile warning:", patientError)
        if (patientError.code !== "ERR_NETWORK" && !patientError.message?.includes("timeout")) {
          errors.push("Failed to save health information")
        }
      }

      // Create emergency contact if provided - with timeout and error handling
      if (formData.emergencyContactName && formData.emergencyContactPhone) {
        try {
          const contactPromise = apiService.post("/api/v1/emergency-contacts", {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
            relation: formData.emergencyContactRelation,
          })
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Request timeout")), 10000)
          )
          await Promise.race([contactPromise, timeoutPromise])
        } catch (contactError: any) {
          console.warn("Emergency contact warning:", contactError)
          if (contactError.code !== "ERR_NETWORK" && !contactError.message?.includes("timeout")) {
            errors.push("Failed to save emergency contact")
          }
        }
      }

      // Mark onboarding as complete - this is critical, retry if needed
      let onboardingComplete = false
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const completePromise = apiService.put("/api/v1/users/profile", {
            onboardingCompleted: true,
          })
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Request timeout")), 10000)
          )
          await Promise.race([completePromise, timeoutPromise])
          onboardingComplete = true
          break
        } catch (completeError: any) {
          console.warn(`Onboarding completion attempt ${attempt + 1} failed:`, completeError)
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      // Update Redux state regardless of API success
      if (user) {
        dispatch(setUser({ ...user, onboardingCompleted: true }))
      }

      if (onboardingComplete) {
        toast.success("Profile setup completed! You can now find and book doctors.")
      } else {
        toast.warning("Setup completed locally. Some data may not be saved. You can update your profile later.")
      }
      
      // Small delay before redirect
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Onboarding error:", error)
      // Even if there are errors, mark as complete locally and redirect
      if (user) {
        dispatch(setUser({ ...user, onboardingCompleted: true }))
      }
      toast.warning("Setup completed. Some features may be limited until backend is available.")
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">Welcome to PulseCal!</CardTitle>
              <CardDescription className="text-base mt-2">
                Let's set up your profile to find the best healthcare providers near you
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Step {step} of {totalSteps}</div>
              <Progress value={progress} className="w-32 mt-2" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Step 1: Basic Info & Location */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5" />
                Basic Information
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
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

              <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <Label className="text-base font-semibold">Location Access</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Allow location access to find doctors near you. This helps us show you the closest healthcare providers.
                </p>
                {locationPermission === "pending" && (
                  <Button onClick={requestLocationPermission} variant="outline" className="w-full">
                    Enable Location Access
                  </Button>
                )}
                {locationPermission === "granted" && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Location access granted ✓</span>
                  </div>
                )}
                {locationPermission === "denied" && (
                  <div className="text-sm text-muted-foreground">
                    You can still search for doctors manually by entering your address below.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="NY"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    placeholder="10001"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={() => setStep(2)} className="w-full" disabled={!formData.phone}>
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Health Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Heart className="h-5 w-5" />
                Health Information
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Select
                  value={formData.bloodType}
                  onValueChange={(value) => setFormData({ ...formData, bloodType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies (optional)</Label>
                <Textarea
                  id="allergies"
                  placeholder="List any allergies you have (e.g., Penicillin, Peanuts)..."
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chronicConditions">Chronic Conditions (optional)</Label>
                <Textarea
                  id="chronicConditions"
                  placeholder="List any chronic conditions (e.g., Diabetes, Hypertension)..."
                  value={formData.chronicConditions}
                  onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Emergency Contact */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Shield className="h-5 w-5" />
                Emergency Contact
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  placeholder="John Doe"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyContactPhone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactRelation">Relationship</Label>
                  <Input
                    id="emergencyContactRelation"
                    placeholder="Spouse, Parent, etc."
                    value={formData.emergencyContactRelation}
                    onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">You're All Set!</p>
                    <ul className="text-sm text-green-800 mt-2 space-y-1">
                      <li>✓ Find doctors near you on the map</li>
                      <li>✓ Book appointments instantly</li>
                      <li>✓ Track your medical records</li>
                      <li>✓ Receive appointment reminders</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                  {loading ? "Completing Setup..." : "Complete Setup"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
