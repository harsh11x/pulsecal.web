"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "signin") {
        // Sign in with email and password
        await signIn(formData.email, formData.password)
        toast.success("Signed in successfully!")
        router.push("/dashboard")
      } else {
        // Sign up with email and password
        const userCredential = await signUp(
          formData.email,
          formData.password,
          `${formData.firstName} ${formData.lastName}`.trim()
        )

        // Sync profile with backend
        await syncUserProfile(
          formData.firstName,
          formData.lastName
        )

        toast.success("Account created successfully!")
        router.push("/onboarding")
      }
    } catch (error: any) {
      console.error("Authentication error:", error)

      // Handle specific Firebase errors
      let errorMessage = "An error occurred"
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email"
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password"
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists"
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

    // Determine redirect based on user state if available
    if (user && user.onboardingCompleted) {
      router.push("/dashboard")
      return
    }

    // Fallback or specific logic for new users
    if (user && user.role === 'DOCTOR' && !user.onboardingCompleted) {
      router.push("/onboarding/doctor")
      return
    }

    // Default behavior if status unknown or just following mode
    // logic: if they were signing up and invalid/no user returned, go to onboarding.
    // if signing in, go to dashboard.
    // BUT if we have user object, trust that.

    if (user) {
      // User exists but onboarding not complete
      router.push("/onboarding")
    } else {
      // Fallback to mode-based redirect
      router.push(mode === "signup" ? "/onboarding" : "/dashboard")
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
            : "Create a new account to get started"}
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

