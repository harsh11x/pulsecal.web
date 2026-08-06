"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
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
import { MapPin, Clock, DollarSign, Upload, CheckCircle, Building2, FileText, User, Search, Coffee, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { IndiaStateSelect, IndiaCitySelect } from "@/components/location/IndiaLocationFields"
import { medicalSpecializations, medicalServices } from "@/lib/medicalData"
import { PLANS, PLAN_YEARLY_AMOUNTS } from "@/lib/planConfig"
import { geocodeClinicLocation } from "@/lib/geocodeClinic"

// Dynamically import the Leaflet map with SSR disabled (Leaflet needs the browser)
const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full rounded-xl border border-border bg-muted/30 animate-pulse flex items-center justify-center text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
})

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
  const [termsAccepted, setTermsAccepted] = useState(false)
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
      monday: { start: "09:00", end: "17:00", isOpen: true, breakStart: "13:00", breakEnd: "14:00" },
      tuesday: { start: "09:00", end: "17:00", isOpen: true, breakStart: "13:00", breakEnd: "14:00" },
      wednesday: { start: "09:00", end: "17:00", isOpen: true, breakStart: "13:00", breakEnd: "14:00" },
      thursday: { start: "09:00", end: "17:00", isOpen: true, breakStart: "13:00", breakEnd: "14:00" },
      friday: { start: "09:00", end: "17:00", isOpen: true, breakStart: "13:00", breakEnd: "14:00" },
      saturday: { start: "09:00", end: "13:00", isOpen: false, breakStart: "", breakEnd: "" },
      sunday: { start: "", end: "", isOpen: false, breakStart: "", breakEnd: "" },
    },

    // Verification
    licenseDocument: null as File | null,
    clinicVerificationDocument: null as File | null,

    // Subscription
    subscriptionPlan: "STARTER" as "STARTER" | "BASIC" | "PROFESSIONAL" | "ENTERPRISE",
    billingCycle: "MONTHLY" as "MONTHLY" | "YEARLY",
  })

  // Helper validation function
  const isValidPhone = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: value });
  };

  // If the doctor changes the address after verifying, invalidate the pinned location
  // so they re-verify instead of keeping a stale pin.
  const clearVerifiedLocation = (next: typeof formData) => ({
    ...next,
    clinicLatitude: "",
    clinicLongitude: "",
  });

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
          const response: any = await apiService.get("/clinics")
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
    setSearchingClinics(true)
    try {
      // Always fetch all to ensure we have the full list to filter from
      // This avoids backend search implementation issues
      const response: any = await apiService.get("/clinics")
      const allClinics = response?.data?.clinics || response?.data || []

      if (!searchTerm) {
        setAvailableClinics(allClinics)
      } else {
        const lowerTerm = searchTerm.toLowerCase()
        const filtered = allClinics.filter((c: any) =>
          c.name?.toLowerCase().includes(lowerTerm) ||
          c.city?.toLowerCase().includes(lowerTerm)
        )
        setAvailableClinics(filtered)
      }
    } catch (error) {
      console.error("Clinic search error:", error)
    } finally {
      setSearchingClinics(false)
    }
  }

  const specializations = medicalSpecializations

  const commonServices = medicalServices

  const handleLocationSearch = async () => {
    if (!formData.clinicAddress && !formData.clinicCity) {
      toast.error("Please enter clinic address and city")
      return
    }

    setVerifyingLocation(true)
    try {
      const location = await geocodeClinicLocation({
        address: formData.clinicAddress,
        city: formData.clinicCity,
        state: formData.clinicState,
        zipCode: formData.clinicZipCode,
        country: formData.clinicCountry || "India",
      })
      setFormData({
        ...formData,
        clinicLatitude: location.lat.toString(),
        clinicLongitude: location.lng.toString(),
      })
      toast.success(
        location.approximate
          ? "Approximate location set — drag the pin to your exact clinic."
          : "Location verified! Drag the pin to fine-tune if needed."
      )
    } catch (error) {
      console.error("Geocoding error:", error)
      toast.error("Failed to verify location. You can continue and adjust later in Profile.")
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
    console.log("=== PAYMENT FLOW STARTED ===");

    try {
      // Validate required fields
      if (!formData.subscriptionPlan) {
        toast.error('Please select a subscription plan')
        setLoading(false)
        return
      }

      // Validate clinic details
      const clinicEmail = formData.clinicEmail || user?.email || ''
      const clinicPhone = formData.clinicPhone || formData.phone || ''

      if (!formData.clinicName || !formData.clinicAddress || !formData.clinicCity ||
        !formData.clinicState || !formData.clinicZipCode) {
        toast.error('Please complete clinic details first')
        setLoading(false)
        setStep(3)
        return
      }

      // Check Razorpay
      if (!(window as any).Razorpay) {
        toast.error("Payment gateway failed to load. Please refresh the page.");
        setLoading(false);
        return;
      }

      console.log("✅ Validation complete");

      // Get fresh token
      console.log("🔐 Getting fresh authentication token...");
      const { getCurrentUser } = await import("@/lib/firebaseAuth");
      const firebaseUser = getCurrentUser();

      if (!firebaseUser) {
        console.error("❌ No Firebase user found");
        toast.error("Session expired. Please log in again.");
        setTimeout(() => router.push("/auth/login?redirect=/onboarding"), 1000);
        setLoading(false);
        return;
      }

      // Force refresh token
      const freshToken = await firebaseUser.getIdToken(true);
      if (!freshToken) {
        console.error("❌ Failed to get token");
        toast.error("Authentication failed. Please log in again.");
        setTimeout(() => router.push("/auth/login?redirect=/onboarding"), 1000);
        setLoading(false);
        return;
      }

      console.log("✅ Token refreshed");
      await new Promise(resolve => setTimeout(resolve, 800));

      // Monthly → Razorpay Subscriptions (true autopay). Yearly handled server-side
      // as a one-time order when billingCycle=YEARLY.
      const payablePlanId =
        formData.subscriptionPlan === "STARTER" ? "BASIC" : formData.subscriptionPlan
      console.log(
        formData.billingCycle === "YEARLY"
          ? "🛒 Creating yearly subscription order..."
          : "🛒 Creating monthly auto-payment subscription..."
      );

      const orderResponse: any = await apiService.post("/payments/create-subscription", {
        plan: payablePlanId,
        billingCycle: formData.billingCycle,
      })
      const orderData = orderResponse?.data || orderResponse

      const isSubscriptionCheckout =
        orderData?.mode === "subscription" || Boolean(orderData?.subscriptionId);

      if (!orderData?.key || (!orderData?.subscriptionId && !orderData?.orderId)) {
        console.error("❌ Invalid checkout data:", orderData);
        toast.error("Failed to create subscription");
        setLoading(false);
        return;
      }

      console.log(
        isSubscriptionCheckout
          ? `✅ Subscription checkout: ${orderData.subscriptionId}`
          : `✅ Order checkout: ${orderData.orderId}`
      );

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
        subscriptionPlan: payablePlanId
      };

      // 2. Open Razorpay
      const payablePlanName = payablePlanId
      const options: Record<string, unknown> = {
        key: orderData.key,
        currency: "INR",
        name: "PulseCal",
        description: isSubscriptionCheckout
          ? `${payablePlanName} monthly auto-payment subscription`
          : formData.billingCycle === "YEARLY"
            ? `${payablePlanName} yearly plan (12 months, 20% off)`
            : `${payablePlanName} plan (1 month)`,
        handler: async (response: any) => {
          try {
            console.log("💳 Payment successful, verifying...");
            toast.loading("Verifying payment...");

            console.log("🔍 Verifying payment with backend...");
            const verifyResponse: any = isSubscriptionCheckout
              ? await apiService.post("/payments/verify-subscription", {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_signature: response.razorpay_signature,
                  clinicDetails: clinicData,
                  plan: payablePlanId
                })
              : await apiService.post("/payments/subscription/verify", {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  clinicDetails: clinicData,
                });

            console.log("✅ Payment verified successfully");
            toast.dismiss();
            toast.success(
              formData.billingCycle === "YEARLY"
                ? "Payment successful! Your clinic is set up for 12 months. Setting up your account..."
                : "Payment successful! Setting up your account..."
            );

            // Extract clinic ID
            const clinicId = verifyResponse?.data?.clinic?.id || verifyResponse?.clinic?.id;
            if (clinicId) {
              setFormData(prev => ({ ...prev, clinicId }));
              console.log("✅ Clinic created:", clinicId);
            }

            // Update Redux state
            if (user) {
              dispatch(setUser({
                ...user,
                role: 'doctor',
                onboardingCompleted: true,
                clinicId: clinicId || user.clinicId
              }));
            }

            setLoading(false);

            // Refresh profile from backend
            try {
              console.log("🔄 Refreshing profile...");
              await firebaseUser.getIdToken(true);
              await new Promise(resolve => setTimeout(resolve, 1000));

              const profileResponse: any = await apiService.get("/auth/profile");
              const userProfile = profileResponse?.data || profileResponse;

              if (userProfile?.id) {
                dispatch(setUser({
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
                  onboardingCompleted: true,
                  clinicId: userProfile.clinicId,
                }));
                console.log("✅ Profile synced");
              }
            } catch (profileError) {
              console.warn("⚠️ Profile sync warning (non-critical):", profileError);
            }

            console.log("✅ Redirecting to dashboard...");
            toast.success("Welcome to PulseCal!");

            setTimeout(() => {
              router.push('/dashboard');
            }, 500);

          } catch (error: any) {
            console.error("❌ Payment verification failed:", error);
            toast.dismiss();
            const errorMsg = error?.response?.data?.message || error?.message || "Verification failed";
            toast.error(`${errorMsg}. Payment ID: ${response.razorpay_payment_id}. Please contact support.`);
            setLoading(false);
          }
        },
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`,
          email: user?.email,
          contact: formData.phone
        },
        theme: {
          color: "#3b82f6"
        },
        modal: {
          ondismiss: () => {
            console.log("⚠️ Payment modal dismissed by user");
            toast.dismiss();
            toast.info("Payment cancelled");
            setLoading(false);
          }
        }
      };

      if (isSubscriptionCheckout) {
        options.subscription_id = orderData.subscriptionId;
      } else {
        options.order_id = orderData.orderId;
        options.amount = orderData.amount;
      }

      console.log("🚀 Opening Razorpay payment modal...");
      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

      paymentObject.on('payment.failed', function (response: any) {
        console.error("❌ Payment failed:", response.error);
        toast.dismiss();
        toast.error(response.error.description || "Payment failed. Please try again.");
        setLoading(false);
      });

    } catch (error: any) {
      console.error("❌ Payment initialization error:", error);
      toast.dismiss();
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to initialize payment. Please try again.";
      toast.error(errorMsg);
      setLoading(false);
    }


  }

  const handleSubmit = async () => {
    setLoading(true)
    const errors: string[] = []

    try {
      // Step 1: Update user profile - with timeout and error handling
      try {
        const profilePromise = apiService.put("/users/profile", {
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
          services: formData.services,
          workingHours: formData.workingHours,
        }

        // Only send clinic contact details when the doctor actually entered
        // them — payment verification already persisted them from clinicDetails,
        // and sending empty strings here would wipe them out.
        if (formData.clinicPhone) doctorProfileData.clinicPhone = formData.clinicPhone;
        if (formData.clinicEmail) doctorProfileData.clinicEmail = formData.clinicEmail;

        if (clinicMode === 'create') {
          // Payment verification (step 6) already created the clinic AND the
          // doctor profile, so we only sync the pin + professional details here.
          // The clinic address fields live on the clinic record and aren't
          // accepted by the update endpoint — sending them would 400.
          doctorProfileData.clinicLatitude = formData.clinicLatitude ? parseFloat(formData.clinicLatitude) : null;
          doctorProfileData.clinicLongitude = formData.clinicLongitude ? parseFloat(formData.clinicLongitude) : null;
        } else if (clinicMode === 'join' && selectedClinicId) {
          doctorProfileData.clinicId = selectedClinicId;
          // If joining, we don't send clinic name/address as they are derived from ID
        }

        // Create mode: POST /doctor-profiles would 400 with "Doctor profile
        // already exists" because payment verification created it — update the
        // existing profile instead. Join mode (no payment) still creates a new one.
        const doctorPromise = clinicMode === 'join'
          ? apiService.post("/doctor-profiles", doctorProfileData)
          : apiService.put("/doctor-profiles/me", doctorProfileData)
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
          const imagePromise = apiService.post("/users/profile/picture", profileFormData, {
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
          const completePromise = apiService.put("/users/profile", {
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
          await apiService.post("/auth/sync-profile", {
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
          const profileResponse: any = await apiService.get("/auth/profile")
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
                  <SelectContent className="max-h-[320px]">
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
                  onChange={(e) => setFormData(clearVerifiedLocation({ ...formData, clinicAddress: e.target.value }))}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <IndiaStateSelect
                  id="clinicState"
                  label="State"
                  required
                  value={formData.clinicState}
                  onChange={(value) =>
                    setFormData(clearVerifiedLocation({ ...formData, clinicState: value, clinicCity: "" }))
                  }
                />
                <IndiaCitySelect
                  id="clinicCity"
                  label="City"
                  required
                  state={formData.clinicState}
                  value={formData.clinicCity}
                  onChange={(value) =>
                    setFormData(clearVerifiedLocation({ ...formData, clinicCity: value }))
                  }
                />
                <div className="space-y-2">
                  <Label htmlFor="clinicZipCode">Pincode *</Label>
                  <Input
                    id="clinicZipCode"
                    placeholder="110001"
                    value={formData.clinicZipCode}
                    onChange={(e) => setFormData(clearVerifiedLocation({ ...formData, clinicZipCode: e.target.value }))}
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
                    onChange={(e) => setFormData(clearVerifiedLocation({ ...formData, clinicCountry: e.target.value }))}
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
                    value={
                      formData.clinicLatitude && formData.clinicLongitude
                        ? `Verified ✓ (${parseFloat(formData.clinicLatitude).toFixed(5)}, ${parseFloat(formData.clinicLongitude).toFixed(5)})`
                        : "Not verified"
                    }
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

                {formData.clinicLatitude && formData.clinicLongitude && (
                  <div className="space-y-2 pt-2">
                    <LocationPickerMap
                      latitude={parseFloat(formData.clinicLatitude)}
                      longitude={parseFloat(formData.clinicLongitude)}
                      onLocationChange={(lat, lng) => {
                        setFormData({
                          ...formData,
                          clinicLatitude: lat.toString(),
                          clinicLongitude: lng.toString(),
                        })
                        toast.success("Clinic location updated")
                      }}
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Coffee className="h-3.5 w-3.5" />
                      Drag the pin on the map to fine-tune the exact clinic location — patients will see this exact spot.
                    </p>
                  </div>
                )}
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
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground w-14 shrink-0">
                            <Coffee className="h-3.5 w-3.5" />
                            Break
                          </span>
                          <Input
                            type="time"
                            value={hours.breakStart || ""}
                            placeholder="13:00"
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                workingHours: {
                                  ...formData.workingHours,
                                  [day]: { ...hours, breakStart: e.target.value },
                                },
                              })
                            }}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={hours.breakEnd || ""}
                            placeholder="14:00"
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                workingHours: {
                                  ...formData.workingHours,
                                  [day]: { ...hours, breakEnd: e.target.value },
                                },
                              })
                            }}
                            className="w-32"
                          />
                          {(hours.breakStart || hours.breakEnd) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-muted-foreground"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  workingHours: {
                                    ...formData.workingHours,
                                    [day]: { ...hours, breakStart: "", breakEnd: "" },
                                  },
                                })
                              }
                              title="Clear break"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Patients won&apos;t be able to book during your break.
                        </p>
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

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 bg-muted/30 p-1.5 rounded-full w-fit mx-auto border border-border">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billingCycle: "MONTHLY" })}
                    className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${formData.billingCycle === "MONTHLY" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billingCycle: "YEARLY" })}
                    className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${formData.billingCycle === "YEARLY" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Yearly
                    <span className="absolute -top-2 -right-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full border border-green-200 font-bold">
                      -20%
                    </span>
                  </button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {formData.billingCycle === "YEARLY"
                    ? "Pay once for 12 months and save 20%."
                    : "Pay month to month. Manage or cancel anytime."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map((plan) => {
                  const isYearly = formData.billingCycle === "YEARLY";
                  const priceAmount = isYearly ? PLAN_YEARLY_AMOUNTS[plan.id] : plan.amount;
                  const displayPrice = `₹${priceAmount.toLocaleString("en-IN")}/${isYearly ? "yr" : "mo"}`;

                  return (
                    <Card key={plan.id}
                      className={`cursor-pointer transition-all hover:border-primary ${formData.subscriptionPlan === plan.id ? 'border-primary border-2 bg-primary/5' : ''}`}
                      onClick={() => setFormData({ ...formData, subscriptionPlan: plan.id as any })}
                    >
                      <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{displayPrice}</CardDescription>
                        {isYearly && (
                          <span className="text-[11px] font-semibold text-green-600">
                            Save 20% · ₹{(plan.amount * 12 - PLAN_YEARLY_AMOUNTS[plan.id]).toLocaleString("en-IN")}
                          </span>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="font-semibold">{plan.limit}</p>
                        <p className="text-xs text-green-600 mt-2 font-medium">
                          {isYearly ? "One-time yearly payment" : "Auto-debits monthly"}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="flex items-start space-x-2 my-4">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="terms" className="text-sm font-normal leading-tight">
                  I agree to the <a href="/terms" target="_blank" className="text-primary hover:underline">Terms and Conditions</a> and <a href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</a>.
                </Label>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
                <Button onClick={handlePayment} disabled={loading || !termsAccepted}>
                  {loading ? "Processing..." : "Pay & Complete Registration"}
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
