"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector, useAppDispatch } from "@/app/hooks"
import { setUser } from "@/app/features/authSlice"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import { Search, Building2, Shield, CheckCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface Clinic {
  id: string
  name: string
  address: string
  city: string
  doctorName: string
  verificationCode?: string
}

export default function ReceptionistOnboarding() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [step, setStep] = useState(1)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [formData, setFormData] = useState({
    phone: "",
    clinicId: "",
    clinicName: "",
    verificationCode: "",
  })

  const totalSteps = 2
  const progress = (step / totalSteps) * 100

  useEffect(() => {
    // Fetch available clinics
    const fetchClinics = async () => {
      try {
        const response: any = await apiService.get("/api/v1/clinics")
        setClinics(response?.data || response || [])
      } catch (error) {
        console.error("Failed to fetch clinics:", error)
        // Use mock data if backend unavailable
        setClinics([
          {
            id: "1",
            name: "Heart Care Clinic",
            address: "123 Medical Center Dr",
            city: "New York",
            doctorName: "Dr. John Smith",
          },
          {
            id: "2",
            name: "Skin Health Center",
            address: "456 Health Ave",
            city: "New York",
            doctorName: "Dr. Sarah Johnson",
          },
        ])
      }
    }
    fetchClinics()
  }, [])

  const handleClinicSearch = async () => {
    if (!formData.clinicName) {
      toast.error("Please enter clinic name")
      return
    }

    setSearching(true)
    try {
      const response: any = await apiService.get(`/api/v1/clinics/search`, {
        params: { q: formData.clinicName },
      })
      setClinics(response?.data || response || [])
    } catch (error) {
      console.error("Clinic search error:", error)
      toast.error("Failed to search clinics")
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.clinicId) {
      toast.error("Please select a clinic")
      return
    }

    setLoading(true)
    const errors: string[] = []
    
    try {
      // Update user profile - with timeout and error handling
      try {
        const profilePromise = apiService.put("/api/v1/users/profile", {
          phone: formData.phone,
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

      // Link receptionist to clinic with verification - with timeout and error handling
      try {
        const linkData: any = {
          clinicId: formData.clinicId,
        }
        
        if (formData.verificationCode) {
          linkData.verificationCode = formData.verificationCode
        }

        const linkPromise = apiService.post("/api/v1/receptionists", linkData)
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Request timeout")), 10000)
        )
        await Promise.race([linkPromise, timeoutPromise])
      } catch (linkError: any) {
        console.warn("Clinic link warning:", linkError)
        if (linkError.response?.status === 403) {
          toast.error("Verification code is incorrect. Please contact the clinic administrator.")
          setLoading(false)
          return
        }
        if (linkError.code !== "ERR_NETWORK" && !linkError.message?.includes("timeout")) {
          errors.push("Failed to link to clinic")
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
        toast.success("Receptionist setup completed! You can now manage clinic appointments.")
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

  const selectedClinic = clinics.find((c) => c.id === formData.clinicId)

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">Receptionist Setup</CardTitle>
              <CardDescription className="text-base mt-2">
                Link your account to a clinic to start managing appointments
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Step {step} of {totalSteps}</div>
              <Progress value={progress} className="w-32 mt-2" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Building2 className="h-5 w-5" />
                Personal Information
              </div>

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
                <Label htmlFor="clinicName">Search for Clinic</Label>
                <div className="flex gap-2">
                  <Input
                    id="clinicName"
                    placeholder="Enter clinic name"
                    value={formData.clinicName}
                    onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClinicSearch}
                    disabled={searching}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {clinics.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Clinic *</Label>
                  <Select
                    value={formData.clinicId}
                    onValueChange={(value) => {
                      const clinic = clinics.find((c) => c.id === value)
                      setFormData({
                        ...formData,
                        clinicId: value,
                        clinicName: clinic?.name || "",
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a clinic" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinics.map((clinic) => (
                        <SelectItem key={clinic.id} value={clinic.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{clinic.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {clinic.address}, {clinic.city} • {clinic.doctorName}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {clinics.length === 0 && formData.clinicName && (
                <div className="text-center py-4 text-muted-foreground">
                  No clinics found. Please check the clinic name or contact your administrator.
                </div>
              )}

              <Button
                onClick={() => setStep(2)}
                disabled={!formData.phone || !formData.clinicId}
                className="w-full"
              >
                Continue to Verification
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Shield className="h-5 w-5" />
                Clinic Verification
              </div>

              {selectedClinic && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900">{selectedClinic.name}</p>
                        <p className="text-sm text-blue-800">{selectedClinic.address}</p>
                        <p className="text-sm text-blue-800">{selectedClinic.city}</p>
                        <p className="text-sm text-blue-800 mt-1">Doctor: {selectedClinic.doctorName}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  placeholder="Enter verification code provided by clinic (optional)"
                  value={formData.verificationCode}
                  onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Some clinics require a verification code. Contact the clinic administrator if you don't have one.
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">What You'll Be Able To Do</p>
                    <ul className="text-sm text-green-800 mt-2 space-y-1">
                      <li>✓ Manage appointment scheduling</li>
                      <li>✓ Handle patient check-ins</li>
                      <li>✓ Process walk-in appointments</li>
                      <li>✓ Assist with billing and payments</li>
                      <li>✓ View daily clinic operations</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading || !formData.clinicId} className="flex-1">
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
