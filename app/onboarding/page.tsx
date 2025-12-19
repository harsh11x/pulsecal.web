"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAppSelector, useAppDispatch } from "@/app/hooks"
import { setUser } from "@/app/features/authSlice"
import PatientOnboarding from "@/components/onboarding/PatientOnboarding"
import DoctorOnboarding from "@/components/onboarding/DoctorOnboarding"
import ReceptionistOnboarding from "@/components/onboarding/ReceptionistOnboarding"
import { Loader2 } from "lucide-react"
import { getIdToken } from "@/lib/firebaseAuth"
import { apiService } from "@/services/api"

export default function OnboardingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchUserProfile = async () => {
      try {
        // Try to fetch user profile from backend if not in Redux
        const token = await getIdToken()
        if (!token) {
          // No token - try Firebase fallback
          await createFirebaseUser()
          return
        }

        try {
          // Use timeout to prevent hanging
          const profilePromise = apiService.get("/api/v1/auth/profile")
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Request timeout")), 5000)
          )
          
          const profileResponse: any = await Promise.race([profilePromise, timeoutPromise])
          const userProfile = profileResponse?.data || profileResponse
          
          if (userProfile && userProfile.id && isMounted) {
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
            }
            dispatch(setUser(userData))
            
            // If user already completed onboarding, redirect to dashboard
            if (userData.onboardingCompleted) {
              router.push("/dashboard")
              return
            }
            
            if (isMounted) {
              setLoading(false)
            }
            return
          }
        } catch (apiError: any) {
          // Network/timeout errors - fallback to Firebase
          if (apiError.code === "ERR_NETWORK" || 
              apiError.message?.includes("Network Error") || 
              apiError.message?.includes("timeout") ||
              apiError.message === "Request timeout") {
            console.warn("Backend not available - using Firebase user")
            await createFirebaseUser()
            return
          }
          throw apiError
        }
      } catch (error: any) {
        console.error("Failed to fetch user profile:", error)
        // Try Firebase fallback
        await createFirebaseUser()
      }
    }

    const createFirebaseUser = async () => {
      try {
        const { getCurrentUser } = await import("@/lib/firebaseAuth")
        const firebaseUser = getCurrentUser()
        if (firebaseUser && isMounted) {
          const nameParts = (firebaseUser.displayName || firebaseUser.email || "User").split(" ")
          const userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            firstName: nameParts[0] || "User",
            lastName: nameParts.slice(1).join(" ") || "",
            role: "patient" as const,
            isActive: true,
            isEmailVerified: firebaseUser.emailVerified || false,
            profileImage: firebaseUser.photoURL || undefined,
            onboardingCompleted: false,
          }
          dispatch(setUser(userData))
          if (isMounted) {
            setLoading(false)
          }
          return
        }
      } catch (firebaseError) {
        console.error("Failed to get Firebase user:", firebaseError)
      }
      
      // If we can't get user profile, redirect to login after a delay
      if (isMounted) {
        setTimeout(() => {
          router.push("/auth/login")
        }, 1000)
      }
    }

    if (!user) {
      // Try to fetch user profile from backend
      fetchUserProfile()
      return () => {
        isMounted = false
      }
    }

    // If user already completed onboarding, redirect to dashboard
    if (user.onboardingCompleted) {
      router.push("/dashboard")
      return
    }

    setLoading(false)

    return () => {
      isMounted = false
    }
  }, [user, router, dispatch])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const role = searchParams.get("role") || (user?.role?.toLowerCase() || "patient")

  switch (role) {
    case "patient":
      return <PatientOnboarding />
    case "doctor":
      return <DoctorOnboarding />
    case "receptionist":
      return <ReceptionistOnboarding />
    default:
      return <PatientOnboarding />
  }
}

