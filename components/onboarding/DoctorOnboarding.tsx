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
import { MapPin, Clock, DollarSign, Upload, CheckCircle, Building2, FileText, User, Search } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { indianStates, citiesByState } from "@/lib/indianLocations"

export default function DoctorOnboarding() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [verifyingLocation, setVerifyingLocation] = useState(false)
  const [clinicMode, setClinicMode] = useState<"join" | "create" | null>(null)
  const [searchingClinics, setSearchingClinics] = useState(false)
  const [availableClinics, setAvailableClinics] = useState<any[]>([])
  const [selectedClinicId, setSelectedClinicId] = useState("")
  const [formData, setFormData] = useState({
    // Personal Info
    phone: "",
    dateOfBirth: "",
    gender: "" as "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | "",
    licenseNumber: "",
    specialization: "",
    qualifications: "",
    yearsOfExperience: "",
    bio: "",
    profileImage: null as File | null,

    // Clinic Info
    clinicId: "", // For joining existing clinic
    clinicName: "",
    clinicAddress: "",
    clinicCity: "",
    clinicState: "",
    clinicZipCode: "",
    clinicCountry: "India",
    clinicPhone: "",
    clinicEmail: "",
    clinicLatitude: "",
    clinicLongitude: "",
    clinicImages: [] as File[],

    // Professional Details
    consultationFee: "",
    services: [] as string[],
    workingHours: {
      monday: { start: "09:00", end: "17:00", isOpen: true },
      tuesday: { start: "09:00", end: "17:00", isOpen: true },
      wednesday: { start: "09:00", end: "17:00", isOpen: true },
      thursday: { start: "09:00", end: "17:00", isOpen: true },
      friday: { start: "09:00", end: "17:00", isOpen: true },
      saturday: { start: "09:00", end: "13:00", isOpen: false },
      sunday: { start: "", end: "", isOpen: false },
    },

    // Verification
    licenseDocument: null as File | null,
    clinicVerificationDocument: null as File | null,

    // Subscription
    subscriptionPlan: "STARTER" as "STARTER" | "BASIC" | "PROFESSIONAL" | "ENTERPRISE",
  })

  // Helper validation function
  const isValidPhone = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: value });
  };

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
  }, [])

  const totalSteps = clinicMode === "join" ? 4 : clinicMode === "create" ? 7 : 1
  const progress = clinicMode ? (step / totalSteps) * 100 : 0

  // Fetch available clinics
  useEffect(() => {
    if (clinicMode === "join") {
      const fetchClinics = async () => {
        try {
          const response: any = await apiService.get("/api/v1/clinics")
          setAvailableClinics(response?.data?.clinics || response?.data || [])
        } catch (error) {
          console.error("Failed to fetch clinics:", error)
          toast.error("Failed to load clinics. Please try again.")
        }
      }
      fetchClinics()
    }
  }, [clinicMode])

  const handleClinicSearch = async (searchTerm: string) => {
    if (!searchTerm) {
      setAvailableClinics([])
      return
    }
    setSearchingClinics(true)
    try {
      const response: any = await apiService.get(`/api/v1/clinics/search`, {
        params: { q: searchTerm },
      })
      setAvailableClinics(response?.data?.clinics || response?.data || [])
    } catch (error) {
      console.error("Clinic search error:", error)
    } finally {
      setSearchingClinics(false)
    }
  }

  const specializations = [
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
    "Gynecology",
    "Ophthalmology",
    "ENT",
    "Radiology",
  ]

  const commonServices = [
    "General Consultation",
    "Follow-up Consultation",
    "Health Checkup",
    "Vaccination",
    "Lab Tests",
    "X-Ray",
    "ECG",
    "Ultrasound",
    "Blood Tests",
    "Physical Examination",
    "Prescription",
    "Telemedicine Consultation",
  ]

  const handleLocationSearch = async () => {
    if (!formData.clinicAddress || !formData.clinicCity) {
      toast.error("Please enter clinic address and city")
      return
    }

    setVerifyingLocation(true)
    try {
      const fullAddress = `${formData.clinicAddress}, ${formData.clinicCity}, ${formData.clinicState} ${formData.clinicZipCode}, ${formData.clinicCountry}`

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          fullAddress
        )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      )
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        setFormData({
          ...formData,
          clinicLatitude: location.lat.toString(),
          clinicLongitude: location.lng.toString(),
        })
        toast.success("Location verified! Your clinic will be discoverable on the map.")
      } else {
        toast.error("Could not find location. Please check the address.")
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      toast.error("Failed to verify location. You can continue without coordinates.")
    } finally {
      setVerifyingLocation(false)
    }
  }

  const handleImageUpload = (type: "profile" | "clinic", files: FileList | null) => {
    if (!files || files.length === 0) return

    if (type === "profile") {
      setFormData({ ...formData, profileImage: files[0] })
      toast.success("Profile image selected")
    } else {
      const newImages = Array.from(files)
      setFormData({ ...formData, clinicImages: [...formData.clinicImages, ...newImages] })
      toast.success(`${newImages.length} clinic image(s) added`)
    }
  }

  const handlePayment = async () => {
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.subscriptionPlan) {
        toast.error('Please select a subscription plan')
        setLoading(false)
        return
      }

      // Validate clinic details before payment
      const clinicEmail = formData.clinicEmail || user?.email || ''
      const clinicPhone = formData.clinicPhone || formData.phone || ''

      if (!formData.clinicName) {
        toast.error('Clinic name is required. Please go back and fill clinic details.')
        setLoading(false)
        setStep(3)
        return
      }
      if (!formData.clinicAddress) {
        toast.error('Clinic address is required. Please go back and fill clinic details.')
        setLoading(false)
        setStep(3)
        return
      }
      if (!formData.clinicCity) {
        toast.error('Clinic city is required. Please go back and fill clinic details.')
        setLoading(false)
        setStep(3)
        return
      }
      if (!formData.clinicState) {
        toast.error('Clinic state is required. Please go back and fill clinic details.')
        setLoading(false)
        setStep(3)
        return
      }
      if (!formData.clinicZipCode) {
        toast.error('Clinic zip code is required. Please go back and fill clinic details.')
        setLoading(false)
        setStep(3)
        return
      }

      // Check if Razorpay is loaded
      if (!(window as any).Razorpay) {
        toast.error("Payment gateway failed to load. Please refresh the page.");
        setLoading(false);
        return;
      }

      // CRITICAL FIX: Force refresh token before payment initiation to prevent 401s
      let token = null;
      try {
        const { getIdToken } = await import("@/lib/firebaseAuth");
        console.log("Forcing token refresh before payment...");
        token = await getIdToken(true);

        if (!token) {
          // Case: Firebase SDK thinks user is logged out (currentUser is null)
          console.error("No token received - user might be logged out in Firebase SDK");
          toast.error("Authentication session lost. Please log in again.");
          // Optional: Dispatch logout or redirect
          router.push("/auth/login?redirect=/onboarding");
          setLoading(false);
          return;
        }
        console.log("Token refreshed successfully");
      } catch (tokenError) {
        console.error("Failed to refresh token before payment:", tokenError);
        // If we can't get a token, we definitely shouldn't proceed
        toast.error("Failed to refresh session. Please check your internet or log in again.");
        setLoading(false);
        return;
      }

      // 1. Create Order
      const { data: orderData }: any = await apiService.post("/doctors/subscription/create", {
        plan: formData.subscriptionPlan
      })

      if (!orderData || !orderData.orderId) {
        throw new Error("Failed to create payment order")
      }

      // 2. Open Razorpay
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "PulseCal",
        description: `${formData.subscriptionPlan} Subscription`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            toast.loading("Verifying payment...");

            // 3. Verify Payment & Create Clinic
            const clinicData = {
              name: formData.clinicName,
              address: formData.clinicAddress,
              city: formData.clinicCity,
              state: formData.clinicState,
              zipCode: formData.clinicZipCode,
              country: formData.clinicCountry || 'India',
              phone: clinicPhone,
              email: clinicEmail,
              latitude: formData.clinicLatitude ? parseFloat(formData.clinicLatitude) : null,
              longitude: formData.clinicLongitude ? parseFloat(formData.clinicLongitude) : null,
              subscriptionPlan: formData.subscriptionPlan
            };

            const verifyResponse: any = await apiService.post("/doctors/subscription/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              clinicDetails: clinicData, // Note: Backend logic now handles renewals if clinicId exists
              plan: formData.subscriptionPlan
            });

            toast.dismiss();
            toast.success("Payment successful! Clinic registered. Redirecting to dashboard...");

            if (verifyResponse.data?.clinic?.id) {
              setFormData(prev => ({ ...prev, clinicId: verifyResponse.data.clinic.id }));
            }

            // Optimistically update Redux state immediately to prevent race conditions
            if (user) {
              dispatch(setUser({
                ...user,
                role: 'doctor',
                onboardingCompleted: true,
                clinicId: verifyResponse.data?.clinic?.id || user.clinicId
              }));
            }

            setLoading(false);

            try {
              // Force refresh user profile from backend to ensure role is updated to DOCTOR
              console.log("Refreshing profile after payment...");
              const profileResponse: any = await apiService.get("/api/v1/auth/profile");
              const userProfile = profileResponse?.data || profileResponse;

              if (userProfile && userProfile.id) {
                const userData = {
                  id: userProfile.id,
                  email: userProfile.email,
                  firstName: userProfile.firstName,
                  lastName: userProfile.lastName,
                  phone: userProfile.phone,
                  dateOfBirth: userProfile.dateOfBirth,
                  role: (userProfile.role || "DOCTOR").toLowerCase() as "patient" | "doctor" | "receptionist" | "admin",
                  isActive: userProfile.isActive !== false,
                  isEmailVerified: userProfile.isEmailVerified || false,
                  profileImage: userProfile.profileImage,
                  onboardingCompleted: true, // Force true
                  clinicId: userProfile.clinicId,
                };
                dispatch(setUser(userData));

                // Allow state to update before redirect
                setTimeout(() => {
                  router.push('/dashboard');
                }, 500);
              } else {
                // Fallback redirect
                router.push('/dashboard');
              }
            } catch (refreshError) {
              console.error("Failed to refresh profile after payment:", refreshError);
              router.push('/dashboard');
            }

          } catch (verifyError: any) {
            console.error("Payment verification failed", verifyError);
            toast.dismiss();
            toast.error(verifyError?.response?.data?.message || "Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`,
          email: user?.email,
          contact: formData.phone
        },
        theme: {
          color: "#0F172A"
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

      paymentObject.on('payment.failed', function (response: any) {
        toast.dismiss();
        toast.error(response.error.description);
        setLoading(false);
      });

    } catch (error: any) {
      console.error("Payment initialization error", error)
      toast.dismiss()
      if (error?.response?.status === 401) {
        toast.error("Session expired. Please refresh the page and try again.");
      } else {
        toast.error(error?.response?.data?.message || error?.message || "Failed to initialize payment");
      }
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    const errors: string[] = []

    try {
      // Step 1: Update user profile - with timeout and error handling
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

      // Step 2: Create/update doctor profile - with timeout and error handling
      try {
        const doctorProfileData: any = {
          licenseNumber: formData.licenseNumber,
          specialization: formData.specialization,
          qualifications: formData.qualifications,
          yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
          consultationFee: parseFloat(formData.consultationFee) || 0,
          bio: formData.bio,
          clinicPhone: formData.clinicPhone,
          clinicEmail: formData.clinicEmail,
          services: formData.services,
          workingHours: formData.workingHours,
        }

        if (clinicMode === 'create') {
          doctorProfileData.clinicName = formData.clinicName;
          doctorProfileData.clinicAddress = `${formData.clinicAddress}, ${formData.clinicCity}, ${formData.clinicState} ${formData.clinicZipCode}`;
          doctorProfileData.clinicCity = formData.clinicCity;
          doctorProfileData.clinicState = formData.clinicState;
          doctorProfileData.clinicZipCode = formData.clinicZipCode;
          doctorProfileData.clinicCountry = formData.clinicCountry;
          doctorProfileData.clinicLatitude = formData.clinicLatitude ? parseFloat(formData.clinicLatitude) : null;
          doctorProfileData.clinicLongitude = formData.clinicLongitude ? parseFloat(formData.clinicLongitude) : null;
        } else if (clinicMode === 'join' && selectedClinicId) {
          doctorProfileData.clinicId = selectedClinicId;
          // If joining, we don't send clinic name/address as they are derived from ID
        }

        // Use the new endpoint for doctor profiles
        const doctorPromise = apiService.post("/api/v1/doctor-profiles", doctorProfileData)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 10000)
        )
        await Promise.race([doctorPromise, timeoutPromise])
      } catch (doctorError: any) {
        console.warn("Doctor profile warning:", doctorError)
        if (doctorError.code !== "ERR_NETWORK" && !doctorError.message?.includes("timeout")) {
          errors.push(doctorError.response?.data?.message || "Failed to save doctor profile")
          // If this fails, we should actually stop and alert the user
          throw new Error(doctorError.response?.data?.message || "Failed to save doctor profile");
        }
      }

      // Step 3: Upload images (if any) - with timeout and error handling
      if (formData.profileImage) {
        try {
          const profileFormData = new FormData()
          profileFormData.append("file", formData.profileImage)
          const imagePromise = apiService.post("/api/v1/users/profile/picture", profileFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), 15000)
          )
          await Promise.race([imagePromise, timeoutPromise])
        } catch (imageError: any) {
          console.warn("Image upload warning:", imageError)
          if (imageError.code !== "ERR_NETWORK" && !imageError.message?.includes("timeout")) {
            errors.push("Failed to upload profile image")
          }
        }
      }

      // Step 4: Mark onboarding as complete - this is critical, retry if needed
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

      // Redundant safety save: Call sync-profile as well
      if (!onboardingComplete) {
        try {
          await apiService.post("/api/v1/auth/sync-profile", {
            onboardingCompleted: true
          })
          console.log("Saved onboarding status via sync-profile fallback")
          onboardingComplete = true
        } catch (e) {
          console.error("Fallback save failed", e)
        }
      }

      // Update Redux state regardless of API success
      if (user) {
        dispatch(setUser({ ...user, onboardingCompleted: true }))
      }

      if (onboardingComplete) {
        toast.success("Doctor registration completed! Your clinic is now discoverable.")

        // Force refresh user profile from backend to ensure onboardingCompleted is persisted
        try {
          const profileResponse: any = await apiService.get("/api/v1/auth/profile")
          const userProfile = profileResponse?.data || profileResponse

          if (userProfile && userProfile.id) {
            const userData = {
              id: userProfile.id,
              email: userProfile.email,
              firstName: userProfile.firstName,
              lastName: userProfile.lastName,
              phone: userProfile.phone,
              dateOfBirth: userProfile.dateOfBirth,
              role: (userProfile.role || "PATIENT").toLowerCase() as "patient" | "doctor" | "receptionist" | "admin",
              isActive: userProfile.isActive !== false,
              isEmailVerified: userProfile.isEmailVerified || false,
              profileImage: userProfile.profileImage,
              onboardingCompleted: userProfile.onboardingCompleted || false,
              clinicId: userProfile.clinicId,
            }
            dispatch(setUser(userData))
            console.log("Profile refreshed after onboarding, onboardingCompleted:", userData.onboardingCompleted)
          }
        } catch (refreshError) {
          console.error("Failed to refresh profile after onboarding:", refreshError)
        }
      } else {
        toast.warning("Registration completed locally. Some data may not be saved. You can update your profile later.")
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
      toast.warning("Registration completed. Some features may be limited until backend is available.")
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">Doctor Registration</CardTitle>
              <CardDescription className="text-base mt-2">
                Set up your professional profile and clinic to start accepting patients
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                {clinicMode ? `Step ${step} of ${totalSteps}` : "Step 1 of 1"}
              </div>
              <Progress value={progress} className="w-32 mt-2" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Step 1: Mode Selection */}
          {!clinicMode && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card
                className="cursor-pointer hover:border-primary hover:bg-accent/50 transition-all border-2 border-transparent hover:shadow-md"
                onClick={() => {
                  setClinicMode("join")
                  setStep(2)
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-primary" />
                    Join Existing Clinic
                  </CardTitle>
                  <CardDescription>
                    For doctors joining a hospital or clinic that is already registered on PulseCal.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Search for your clinic</li>
                    <li>Send join request</li>
                    <li>Wait for admin approval</li>
                  </ul>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-primary hover:bg-accent/50 transition-all border-2 border-transparent hover:shadow-md"
                onClick={() => {
                  setClinicMode("create")
                  setStep(2)
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    Create New Clinic
                  </CardTitle>
                  <CardDescription>
                    For doctors starting their own practice or clinic admins.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Register a new facility</li>
                    <li>Set up subscription</li>
                    <li>Invite other doctors</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Personal & Professional Info (after clinic selection) */}
          {step === 2 && clinicMode && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5" />
                Personal & Professional Information
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210 (10 digits)"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    required
                    className={!isValidPhone(formData.phone) && formData.phone ? "border-red-500" : ""}
                  />
                  {formData.phone && !isValidPhone(formData.phone) && (
                    <p className="text-xs text-red-500 mt-1">Must be exactly 10 digits</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Medical License Number *</Label>
                  <Input
                    id="licenseNumber"
                    placeholder="Enter your medical license number"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={user?.firstName || ""}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">From your account</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={user?.lastName || ""}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">From your account</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value as typeof formData.gender })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                      <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>


              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization *</Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your specialization" />
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    placeholder="5"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualifications">Qualifications</Label>
                  <Input
                    id="qualifications"
                    placeholder="MD, MBBS, etc."
                    value={formData.qualifications}
                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell patients about your experience, expertise, and approach to healthcare..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileImage">Profile Picture</Label>
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload("profile", e.target.files)}
                />
              </div>

              <Button onClick={() => {
                if (clinicMode === "create") {
                  setStep(3) // Go to clinic creation
                } else if (clinicMode === "join") {
                  setStep(3) // Go to clinic selection
                } else {
                  // Should not happen, but go back to selection
                  setClinicMode(null)
                  setStep(1)
                }
              }} className="w-full" disabled={!formData.phone || !isValidPhone(formData.phone) || !formData.licenseNumber || !formData.specialization}>
                Continue
              </Button>
            </div>
          )}

          {/* Step 3: Join Existing Clinic */}
          {step === 3 && clinicMode === "join" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Building2 className="h-5 w-5" />
                Join Existing Hospital/Clinic
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicSearch">Search for Hospital/Clinic</Label>
                <div className="flex gap-2">
                  <Input
                    id="clinicSearch"
                    placeholder="Search by name, city, or address..."
                    onChange={(e) => handleClinicSearch(e.target.value)}
                  />
                </div>
              </div>

              {availableClinics.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Clinic</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                    {availableClinics.map((clinic) => (
                      <Card
                        key={clinic.id}
                        className={`cursor-pointer transition-all hover:border-primary ${selectedClinicId === clinic.id ? "border-primary border-2" : ""
                          }`}
                        onClick={() => {
                          setSelectedClinicId(clinic.id)
                          setFormData({ ...formData, clinicId: clinic.id, clinicName: clinic.name })
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{clinic.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {clinic.address}, {clinic.city}, {clinic.state}
                              </p>
                              {clinic.phone && (
                                <p className="text-xs text-muted-foreground">{clinic.phone}</p>
                              )}
                            </div>
                            {selectedClinicId === clinic.id && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {availableClinics.length === 0 && !searchingClinics && (
                <p className="text-center text-muted-foreground py-8">
                  No clinics found. Try a different search term or create your own clinic.
                </p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="flex-1"
                  disabled={!selectedClinicId}
                >
                  Continue to Services & Fees
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Clinic Information (Create New) */}
          {step === 3 && clinicMode === "create" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Building2 className="h-5 w-5" />
                Clinic Information
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic Name *</Label>
                <Input
                  id="clinicName"
                  placeholder="Enter your clinic name"
                  value={formData.clinicName}
                  onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicAddress">Street Address *</Label>
                <Input
                  id="clinicAddress"
                  placeholder="123, MG Road"
                  value={formData.clinicAddress}
                  onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="clinicState">State *</Label>
                  <Select
                    value={formData.clinicState}
                    onValueChange={(value) => setFormData({ ...formData, clinicState: value, clinicCity: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {indianStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicCity">City *</Label>
                  <Select
                    value={formData.clinicCity}
                    onValueChange={(value) => setFormData({ ...formData, clinicCity: value })}
                    disabled={!formData.clinicState}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.clinicState ? "Select City" : "Select State First"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {(citiesByState[formData.clinicState] || []).map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicZipCode">Pincode *</Label>
                  <Input
                    id="clinicZipCode"
                    placeholder="110001"
                    value={formData.clinicZipCode}
                    onChange={(e) => setFormData({ ...formData, clinicZipCode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clinicCountry">Country *</Label>
                  <Input
                    id="clinicCountry"
                    placeholder="India"
                    value={formData.clinicCountry}
                    onChange={(e) => setFormData({ ...formData, clinicCountry: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicPhone">Clinic Phone</Label>
                  <Input
                    id="clinicPhone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.clinicPhone}
                    onChange={(e) => setFormData({ ...formData, clinicPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicEmail">Clinic Email</Label>
                <Input
                  id="clinicEmail"
                  type="email"
                  placeholder="clinic@example.com"
                  value={formData.clinicEmail}
                  onChange={(e) => setFormData({ ...formData, clinicEmail: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Location Verification</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Click to verify location on map"
                    value={formData.clinicLatitude && formData.clinicLongitude ? "Location verified ✓" : "Not verified"}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLocationSearch}
                    disabled={verifyingLocation || !formData.clinicAddress || !formData.clinicCity}
                  >
                    {verifyingLocation ? (
                      "Verifying..."
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 mr-2" />
                        Verify Location
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Verifying your location enables patients to find you on the map
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="flex-1"
                  disabled={!formData.clinicName || !formData.clinicAddress || !formData.clinicCity}
                >
                  Continue to Services & Fees
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Services & Fees */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <span className="text-xl">₹</span>
                Services & Consultation Fees
              </div>

              <div className="space-y-2">
                <Label htmlFor="consultationFee">Base Consultation Fee (₹) *</Label>
                <Input
                  id="consultationFee"
                  type="number"
                  placeholder="100"
                  value={formData.consultationFee}
                  onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is your standard consultation fee. You can set different fees for different services later.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Services Offered *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg">
                  {commonServices.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={service}
                        checked={formData.services.includes(service)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              services: [...formData.services, service],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              services: formData.services.filter((s) => s !== service),
                            })
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={service} className="text-sm font-normal cursor-pointer">
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select all services you offer at your clinic
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  if (clinicMode === "join") {
                    setStep(3)
                  } else {
                    setStep(3)
                  }
                }} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => {
                  if (clinicMode === "join") {
                    setStep(7) // Skip working hours and plan, go to Verification for joiners
                  } else {
                    setStep(5) // Go to working hours for creators
                  }
                }} className="flex-1" disabled={!formData.consultationFee || formData.services.length === 0}>
                  {clinicMode === "join" ? "Continue to Verification" : "Continue to Working Hours"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Working Hours (Only for creating new clinic) */}
          {step === 5 && clinicMode === "create" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="h-5 w-5" />
                Working Hours & Availability
              </div>

              <div className="space-y-3">
                {Object.entries(formData.workingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 w-24">
                      <input
                        type="checkbox"
                        checked={hours.isOpen}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            workingHours: {
                              ...formData.workingHours,
                              [day]: { ...hours, isOpen: e.target.checked },
                            },
                          })
                        }}
                        className="rounded w-4 h-4"
                      />
                      <Label className="capitalize font-medium">{day}</Label>
                    </div>
                    {hours.isOpen && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={hours.start}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              workingHours: {
                                ...formData.workingHours,
                                [day]: { ...hours, start: e.target.value },
                              },
                            })
                          }}
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={hours.end}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              workingHours: {
                                ...formData.workingHours,
                                [day]: { ...hours, end: e.target.value },
                              },
                            })
                          }}
                          className="w-32"
                        />
                      </div>
                    )}
                    {!hours.isOpen && (
                      <span className="text-sm text-muted-foreground">Closed</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Clinic Images</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload("clinic", e.target.files)}
                />
                <p className="text-xs text-muted-foreground">
                  Upload photos of your clinic to help patients recognize your facility
                </p>
                {formData.clinicImages.length > 0 && (
                  <div className="text-sm text-green-600 mt-2">
                    {formData.clinicImages.length} image(s) selected
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(6)} className="flex-1">
                  Continue to Select Plan
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Plan Selection (Only for creating new clinic) */}
          {step === 6 && clinicMode === "create" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <span className="text-xl">₹</span>
                Select Subscription Plan
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { id: 'STARTER', name: 'Starter', price: '₹1/mo', limit: 'Solo Practitioner (1 Doctor)', highlight: true },
                  { id: 'BASIC', name: 'Basic', price: '₹1499/mo', limit: 'Max 5 Doctors', highlight: false },
                  { id: 'PROFESSIONAL', name: 'Professional', price: '₹2999/mo', limit: 'Max 10 Doctors', highlight: false },
                  { id: 'ENTERPRISE', name: 'Enterprise', price: '₹4999/mo', limit: 'Unlimited Doctors', highlight: false }
                ].map((plan) => (
                  <Card key={plan.id}
                    className={`cursor-pointer transition-all hover:border-primary ${formData.subscriptionPlan === plan.id ? 'border-primary border-2 bg-primary/5' : ''}`}
                    onClick={() => setFormData({ ...formData, subscriptionPlan: plan.id as any })}
                  >
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.price}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="font-semibold">{plan.limit}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(5)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handlePayment} disabled={loading} className="flex-1">
                  {loading ? "Processing..." : "Pay & Create Clinic"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 7: Verification & Complete */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5" />
                Verification Documents
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseDocument">Medical License Document</Label>
                  <Input
                    id="licenseDocument"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFormData({ ...formData, licenseDocument: e.target.files[0] })
                        toast.success("License document selected")
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a copy of your medical license for verification
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicVerificationDocument">Clinic Registration Document</Label>
                  <Input
                    id="clinicVerificationDocument"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFormData({ ...formData, clinicVerificationDocument: e.target.files[0] })
                        toast.success("Clinic verification document selected")
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload clinic registration or business license (optional)
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Review Your Information</p>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1">
                      <li>✓ Clinic will be discoverable on the map</li>
                      <li>✓ Patients can book appointments with you</li>
                      <li>✓ You'll receive notifications for new bookings</li>
                      <li>✓ Access to analytics and revenue reports</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  if (clinicMode === "join") {
                    setStep(4)
                  } else {
                    setStep(6) // Back to plan selection
                  }
                }} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                  {loading ? "Completing Registration..." : "Complete Registration"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
