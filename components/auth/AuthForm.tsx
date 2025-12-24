"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleSignInButton } from "./GoogleSignInButton"
import { signIn, signUp, syncUserProfile } from "@/lib/firebaseAuth"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"

interface AuthFormProps {
  mode: "signin" | "signup"
  selectedRole?: "patient" | "doctor" | "receptionist" | null
  onSuccess?: () => void
}

export function AuthForm({ mode, selectedRole, onSuccess }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  })

  // Get role from props or URL parameter
  const role = selectedRole || (searchParams?.get("role") as "patient" | "doctor" | "receptionist" | null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "signin") {
        // Sign in with email and password
        await signIn(formData.email, formData.password)
        toast.success("Signed in successfully!")
        
        // Existing users always go to dashboard
        router.push("/dashboard")
      } else {
        // Sign up with email and password
        const userCredential = await signUp(
          formData.email,
          formData.password,
          `${formData.firstName} ${formData.lastName}`.trim()
        )

        const userRole = role?.toUpperCase() as "PATIENT" | "DOCTOR" | "RECEPTIONIST" | undefined

        // Sync profile with backend
        await syncUserProfile(
          formData.firstName,
          formData.lastName,
          undefined, // phone
          undefined, // dob
          undefined, // image
          userRole || "PATIENT"
        )

        toast.success("Account created successfully!")

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess()
        }

        // Route based on role
        if (userRole === "DOCTOR") {
          router.push("/onboarding?role=doctor")
        } else if (userRole === "RECEPTIONIST") {
          router.push("/onboarding?role=receptionist")
        } else {
          router.push("/onboarding?role=patient")
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error)

      // Handle specific Firebase errors
      let errorMessage = "An error occurred"
      
      // Special handling for existing users trying to sign up
      if (error.code === "auth/email-already-in-use" && mode === "signup") {
        // User already exists - try to sign them in instead
        try {
          toast.info("Account already exists. Signing you in...")
          await signIn(formData.email, formData.password)
          toast.success("Signed in successfully!")
          router.push("/dashboard")
          return
        } catch (signInError: any) {
          // If sign-in fails, show helpful message
          if (signInError.code === "auth/wrong-password") {
            errorMessage = "Account already exists with this email. Please use the correct password or reset it."
          } else {
            errorMessage = "Account already exists. Please sign in instead."
          }
        }
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email"
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address"
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = (user?: any) => {
    toast.success(
      mode === "signin"
        ? "Signed in with Google successfully!"
        : "Account created with Google successfully!"
    )

    // Determine role priority:
    // 1. User data from backend (if available)
    // 2. sessionStorage (set by GetStartedAction)
    // 3. URL parameter
    // 4. selectedRole prop
    // 5. Default to PATIENT

    let userRole: string | undefined

    // Check backend user data first
    if (user?.role) {
      userRole = user.role.toUpperCase()
      console.log("✅ Using role from backend:", userRole)
    }

    // Fallback to sessionStorage
    if (!userRole) {
      const storedRole = sessionStorage.getItem('selectedRole') || sessionStorage.getItem('pendingAuthRole')
      if (storedRole) {
        userRole = storedRole.toUpperCase()
        console.log("✅ Using role from sessionStorage:", userRole)
      }
    }

    // Fallback to URL parameter
    if (!userRole) {
      const urlRole = searchParams?.get("role")?.toUpperCase()
      if (urlRole) {
        userRole = urlRole
        console.log("✅ Using role from URL:", userRole)
      }
    }

    // Fallback to selectedRole prop
    if (!userRole && selectedRole) {
      userRole = selectedRole.toUpperCase()
      console.log("✅ Using role from prop:", userRole)
    }

    // Default to PATIENT
    if (!userRole) {
      userRole = "PATIENT"
      console.log("⚠️ No role found, defaulting to PATIENT")
    }

    // Clean up sessionStorage
    sessionStorage.removeItem('selectedRole')
    sessionStorage.removeItem('pendingAuthRole')

    // If user exists (has any data), go to dashboard - skip onboarding
    if (user?.onboardingCompleted || user?.id) {
      console.log("✅ Existing user, redirecting to dashboard")
      router.push("/dashboard")
      return
    }

    // Only new users go to onboarding
    console.log(`🚀 Redirecting to onboarding for role: ${userRole}`)
    if (userRole === 'DOCTOR') {
      router.push("/onboarding?role=doctor")
    } else if (userRole === 'RECEPTIONIST') {
      router.push("/onboarding?role=receptionist")
    } else {
      router.push("/onboarding?role=patient")
    }
  }

  const handleGoogleError = (error: Error) => {
    console.error("Google authentication error:", error)
    toast.error("Google authentication failed. Please try again.")
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          {mode === "signin" ? "Sign In" : "Sign Up"}
        </h1>
        <p className="text-muted-foreground">
          {mode === "signin"
            ? "Enter your credentials to access your account"
            : `Create a new ${searchParams?.get("role") || ""} account to get started`}
        </p>
      </div>

      <div className="space-y-4">
        {/* Google Sign In Button */}
        <GoogleSignInButton
          mode={mode}
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required={mode === "signup"}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required={mode === "signup"}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "signin" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              mode === "signin" ? "Sign In" : "Sign Up"
            )}
          </Button>
        </form>
      </div>

      <div className="text-center text-sm">
        {mode === "signin" ? (
          <>
            Don't have an account?{" "}
            <a
              href="/auth/signup"
              className="text-primary hover:underline"
            >
              Sign up
            </a>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <a
              href="/auth/login"
              className="text-primary hover:underline"
            >
              Sign in
            </a>
          </>
        )}
      </div>
    </div>
  )
}

