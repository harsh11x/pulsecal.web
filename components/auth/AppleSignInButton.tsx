"use client"

import { Button } from "@/components/ui/button"
import { signInWithApple, syncUserProfile } from "@/lib/firebaseAuth"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface AppleSignInButtonProps {
  mode?: "signin" | "signup"
  onSuccess?: (user?: any) => void
  onError?: (error: Error) => void
}

export function AppleSignInButton({
  mode = "signin",
  onSuccess,
  onError
}: AppleSignInButtonProps) {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  const handleAppleAuth = async () => {
    try {
      setLoading(true)

      let role = searchParams?.get("role")?.toUpperCase() as "PATIENT" | "DOCTOR" | "RECEPTIONIST" | undefined
      if (!role) {
        const storedRole = sessionStorage.getItem('selectedRole')
        if (storedRole) {
          role = storedRole as "PATIENT" | "DOCTOR" | "RECEPTIONIST"
        }
      }
      if (role) {
        sessionStorage.setItem('pendingAuthRole', role)
      }

      const userCredential = await signInWithApple()

      const storedRole = sessionStorage.getItem('pendingAuthRole') as "PATIENT" | "DOCTOR" | "RECEPTIONIST" | undefined

      let user
      try {
        user = await syncUserProfile(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          storedRole || role || "PATIENT"
        )
      } catch (syncError: any) {
        console.warn("Profile sync failed (non-blocking):", syncError.message)
        user = { role: storedRole || role || "PATIENT" }
      }

      sessionStorage.removeItem('pendingAuthRole')
      sessionStorage.removeItem('selectedRole')

      onSuccess?.(user)
    } catch (error: any) {
      console.error("Apple authentication error:", error)
      sessionStorage.removeItem('pendingAuthRole')
      sessionStorage.removeItem('selectedRole')

      let errorMessage = "Sign in with Apple failed. Please try again."
      let shouldShowError = true

      if (error.code === "auth/popup-blocked") {
        errorMessage = "Popup was blocked. Please allow popups for this site."
      } else if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
        shouldShowError = false
      }

      if (shouldShowError) {
        onError?.(new Error(errorMessage))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full bg-black text-white hover:bg-neutral-800 border-black"
      onClick={handleAppleAuth}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {mode === "signin" ? "Signing in..." : "Signing up..."}
        </>
      ) : (
        <>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          {mode === "signin" ? "Sign in with Apple" : "Sign up with Apple"}
        </>
      )}
    </Button>
  )
}
