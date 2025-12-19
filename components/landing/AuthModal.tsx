"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { signIn, signUp, signInWithGoogle, signUpWithGoogle, syncUserProfile, getIdToken } from "@/lib/firebaseAuth"
import { toast } from "sonner"
import { useAppDispatch } from "@/app/hooks"
import { setUser } from "@/app/features/authSlice"
import { apiService } from "@/services/api"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "login" | "signup"
  onSwitchMode: (mode: "login" | "signup") => void
  role?: "doctor" | "patient" | "receptionist"
}

export function AuthModal({ isOpen, onClose, mode, onSwitchMode, role = "patient" }: AuthModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()

  // Reset form when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      setEmail("")
      setPassword("")
      setName("")
      setShowPassword(false)
      setLoading(false)
      setGoogleLoading(false)
    }
  }, [isOpen, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "login") {
        await signIn(email, password)
        
        // Wait for Firebase to initialize
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Fetch user profile and update Redux
        try {
          const token = await getIdToken()
          if (token) {
            // Wait a bit for backend to be ready
            await new Promise(resolve => setTimeout(resolve, 500))
            
            try {
              const profilePromise = apiService.get("/api/v1/auth/profile")
              const timeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error("Request timeout")), 5000)
              )
              
              const profileResponse: any = await Promise.race([profilePromise, timeoutPromise])
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
                }
                dispatch(setUser(userData))
              }
            } catch (apiError: any) {
              console.warn("Failed to fetch user profile:", apiError)
              // Don't block - user can still proceed
            }
          }
        } catch (tokenError: any) {
          console.warn("Failed to get token:", tokenError)
          // Don't block - user can still proceed
        }
        
        toast.success("Signed in successfully!")
        router.push("/dashboard")
        onClose()
      } else {
        // Signup flow
        const nameParts = name.trim().split(" ")
        const firstName = nameParts[0] || ""
        const lastName = nameParts.slice(1).join(" ") || ""
        
        if (!name.trim()) {
          toast.error("Please enter your full name")
          setLoading(false)
          return
        }
        
        const userCredential = await signUp(
          email,
          password,
          name.trim()
        )
        
        // Wait for Firebase to initialize
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Normalize role to uppercase for backend
        const normalizedRole = role.toUpperCase() as "PATIENT" | "DOCTOR" | "RECEPTIONIST"
        
        // Sync profile with role
        try {
          await syncUserProfile(firstName, lastName, undefined, undefined, undefined, normalizedRole)
        } catch (syncError: any) {
          console.warn("Profile sync warning:", syncError)
          // Don't block - user can complete onboarding
        }
        
        // Fetch user profile and update Redux
        try {
          const token = await getIdToken()
          if (token) {
            await new Promise(resolve => setTimeout(resolve, 500))
            
            try {
              const profilePromise = apiService.get("/api/v1/auth/profile")
              const timeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error("Request timeout")), 5000)
              )
              
              const profileResponse: any = await Promise.race([profilePromise, timeoutPromise])
              const userProfile = profileResponse?.data || profileResponse
              
              if (userProfile && userProfile.id) {
                const userData = {
                  id: userProfile.id,
                  email: userProfile.email,
                  firstName: userProfile.firstName || firstName,
                  lastName: userProfile.lastName || lastName,
                  phone: userProfile.phone,
                  dateOfBirth: userProfile.dateOfBirth,
                  role: (userProfile.role || normalizedRole).toLowerCase() as "patient" | "doctor" | "receptionist" | "admin",
                  isActive: userProfile.isActive !== false,
                  isEmailVerified: userProfile.isEmailVerified || false,
                  profileImage: userProfile.profileImage,
                  onboardingCompleted: userProfile.onboardingCompleted || false,
                }
                dispatch(setUser(userData))
              }
            } catch (apiError: any) {
              console.warn("Failed to fetch user profile:", apiError)
              // Create minimal user data for onboarding
              const userData = {
                id: userCredential.user.uid,
                email: userCredential.user.email || email,
                firstName: firstName,
                lastName: lastName,
                role: role.toLowerCase() as "patient" | "doctor" | "receptionist" | "admin",
                isActive: true,
                isEmailVerified: userCredential.user.emailVerified || false,
                profileImage: userCredential.user.photoURL,
                onboardingCompleted: false,
              }
              dispatch(setUser(userData))
            }
          }
        } catch (tokenError: any) {
          console.warn("Failed to get token:", tokenError)
          // Create minimal user data for onboarding
          const userData = {
            id: userCredential.user.uid,
            email: userCredential.user.email || email,
            firstName: firstName,
            lastName: lastName,
            role: role.toLowerCase() as "patient" | "doctor" | "receptionist" | "admin",
            isActive: true,
            isEmailVerified: userCredential.user.emailVerified || false,
            profileImage: userCredential.user.photoURL,
            onboardingCompleted: false,
          }
          dispatch(setUser(userData))
        }
        
        toast.success("Account created successfully!")
        router.push(`/onboarding?role=${role}`)
        onClose()
      }
    } catch (error: any) {
      console.error("Authentication error:", error)
      
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

  const handleGoogleAuth = async () => {
    setGoogleLoading(true)
    try {
      let userCredential
      let isNewUser = false
      try {
        // For Google auth, signInWithGoogle works for both login and signup
        // It creates account if doesn't exist, signs in if exists
        userCredential = await signInWithGoogle()
        
        // Check if this is a new user by checking if they have a profile in backend
        // We'll determine this after trying to fetch their profile
        isNewUser = false
      } catch (authError: any) {
        // Handle specific Firebase errors
        if (authError.message?.includes('initial state') || 
            authError.message?.includes('sessionStorage') ||
            authError.message?.includes('missing initial state')) {
          toast.error('Authentication state error. Please refresh the page and try again.')
          throw authError
        }
        // If it's a login attempt but account doesn't exist, suggest signup
        if (mode === "login" && authError.code === "auth/user-not-found") {
          toast.error("No account found. Please sign up first.")
          onSwitchMode("signup")
          throw authError
        }
        // Re-throw Firebase auth errors to be handled below
        throw authError
      }
      
      // Ensure we have a user
      if (!userCredential?.user || !userCredential.user.uid) {
        throw new Error("Authentication completed but user data not available")
      }
      
      // Wait for Firebase to fully initialize and stabilize
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Normalize role to uppercase for backend
      const normalizedRole = role.toUpperCase() as "PATIENT" | "DOCTOR" | "RECEPTIONIST"
      
      // First, try to fetch user profile to check if user already exists
      let userHasProfile = false
      let userOnboardingCompleted = false
      
      try {
        // Get token with retry
        let token: string | null = null
        for (let i = 0; i < 3; i++) {
          token = await getIdToken(true) // Force refresh
          if (token) break
          await new Promise(resolve => setTimeout(resolve, 400))
        }
        
        if (token) {
          // Wait a bit more for backend to be ready
          await new Promise(resolve => setTimeout(resolve, 500))
          
          try {
            // Use a timeout to prevent hanging
            const profilePromise = apiService.get("/api/v1/auth/profile")
            const timeoutPromise = new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error("Request timeout")), 5000)
            )
            
            const profileResponse: any = await Promise.race([profilePromise, timeoutPromise])
            const userProfile = profileResponse?.data || profileResponse
            
            if (userProfile && userProfile.id) {
              userHasProfile = true
              userOnboardingCompleted = userProfile.onboardingCompleted || false
              
              // Map backend user data to frontend User type
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
                onboardingCompleted: userOnboardingCompleted,
              }
              dispatch(setUser(userData))
              
              // If user hasn't completed onboarding, treat as new signup
              if (!userOnboardingCompleted) {
                isNewUser = true
              }
            } else {
              // No profile found - this is a new user
              isNewUser = true
            }
          } catch (apiError: any) {
            // Network/timeout errors - check if it's a 404 (user doesn't exist)
            if (apiError.response?.status === 404) {
              // User doesn't exist - this is a new user
              isNewUser = true
            } else if (apiError.code === "ERR_NETWORK" || 
                apiError.message?.includes("Network Error") || 
                apiError.message?.includes("timeout") ||
                apiError.message === "Request timeout") {
              // Backend unavailable - if mode is login, assume user exists
              // If mode is signup, treat as new user
              if (mode === "login") {
                userHasProfile = true // Assume existing user if backend unavailable
              } else {
                isNewUser = true
              }
              console.warn("Backend not available - user can still proceed.")
            } else {
              console.warn("Failed to fetch user profile:", apiError.message || apiError)
              // For other errors, if mode is login, assume user exists
              if (mode === "login") {
                userHasProfile = true
              }
            }
          }
        }
      } catch (profileError: any) {
        // Any other errors - just log and continue
        console.warn("Profile fetch error:", profileError.message || profileError)
        // If mode is login and we can't fetch, assume user exists
        if (mode === "login") {
          userHasProfile = true
        }
      }
      
      // Sync profile with backend (only if user doesn't exist or needs update)
      // This will create profile if it doesn't exist
      if (!userHasProfile || isNewUser) {
        try {
          await syncUserProfile(undefined, undefined, undefined, undefined, undefined, normalizedRole)
        } catch (syncError: any) {
          // If sync fails, log but don't block the flow
          console.warn("Profile sync warning:", syncError)
        }
      }
      
      // Fetch user profile again after sync (if we synced)
      if (!userHasProfile || isNewUser) {
        try {
          // Get token with retry
          let token: string | null = null
          for (let i = 0; i < 3; i++) {
            token = await getIdToken(true) // Force refresh
            if (token) break
            await new Promise(resolve => setTimeout(resolve, 400))
          }
          
          if (token) {
            // Wait a bit more for backend to be ready
            await new Promise(resolve => setTimeout(resolve, 500))
            
            try {
              // Use a timeout to prevent hanging
              const profilePromise = apiService.get("/api/v1/auth/profile")
              const timeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error("Request timeout")), 5000)
              )
              
              const profileResponse: any = await Promise.race([profilePromise, timeoutPromise])
              // Backend returns { success: true, data: {...}, message: "..." }
              const userProfile = profileResponse?.data || profileResponse
              
              if (userProfile && userProfile.id) {
                userHasProfile = true
                // Map backend user data to frontend User type
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
                
                // If user hasn't completed onboarding, treat as new signup
                if (!userProfile.onboardingCompleted) {
                  isNewUser = true
                }
              } else {
                // No profile found - this is a new user
                isNewUser = true
              }
            } catch (apiError: any) {
              // Network/timeout errors are expected if backend is not running
              // Don't block the flow - onboarding page will handle fetching the profile
              if (apiError.code === "ERR_NETWORK" || 
                  apiError.message?.includes("Network Error") || 
                  apiError.message?.includes("timeout") ||
                  apiError.message === "Request timeout") {
                console.warn("Backend not available - user can still proceed. Onboarding page will fetch profile.")
                // If backend is not available and mode is login, assume user exists
                // If mode is signup, treat as new user
                if (mode === "login") {
                  userHasProfile = true // Assume existing user if backend unavailable
                } else {
                  isNewUser = true
                }
              } else {
                console.warn("Failed to fetch user profile:", apiError.message || apiError)
                // If it's a 404 or similar, user doesn't exist
                if (apiError.response?.status === 404) {
                  isNewUser = true
                }
              }
            }
          }
        } catch (profileError: any) {
          // Any other errors - just log and continue
          console.warn("Profile fetch error:", profileError.message || profileError)
        }
      }
      
      // Determine redirect based on mode and user status
      let redirectPath = "/dashboard"
      let successMessage = "Signed in with Google successfully!"
      
      if (mode === "signup") {
        // Signup mode - always go to onboarding
        redirectPath = `/onboarding?role=${role}`
        successMessage = "Account created with Google successfully!"
      } else if (mode === "login") {
        // Login mode - check user status
        if (!userHasProfile) {
          // User doesn't exist - this shouldn't happen in login, but handle it
          toast.error("No account found. Please sign up first.")
          onSwitchMode("signup")
          setGoogleLoading(false)
          return
        } else if (isNewUser || !userOnboardingCompleted) {
          // User exists but hasn't completed onboarding
          redirectPath = `/onboarding?role=${role}`
          successMessage = "Signed in successfully! Please complete your profile."
        } else {
          // User exists and has completed onboarding - go to dashboard
          redirectPath = "/dashboard"
          successMessage = "Signed in with Google successfully!"
        }
      }
      
      toast.success(successMessage)
      
      // Small delay before redirect to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, 300))
      
      router.push(redirectPath)
      onClose()
    } catch (error: any) {
      console.error("Google authentication error:", error)
      
      // Handle specific error cases
      let errorMessage = "Google authentication failed. Please try again."
      
      if (error.code === "auth/popup-blocked") {
        errorMessage = "Popup was blocked. Please allow popups for this site and try again."
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in was cancelled. Please try again."
      } else if (error.code === "auth/account-exists-with-different-credential") {
        errorMessage = "An account already exists with this email. Please sign in with your password."
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "Only one popup request is allowed at a time. Please try again."
      } else if (error.code === "auth/unauthorized-domain") {
        errorMessage = "This domain is not authorized. Please contact support."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-[calc(100%-100px)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "login" ? "Signing in..." : "Signing up..."}
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {mode === "login" ? "Sign in with Google" : "Sign up with Google"}
              </>
            )}
          </Button>

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

          <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => router.push("/auth/forgot-password")}
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || googleLoading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              mode === "login" ? "Log in" : "Sign up"
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button type="button" onClick={() => onSwitchMode("signup")} className="text-primary hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => onSwitchMode("login")} className="text-primary hover:underline">
                  Log in
                </button>
              </>
            )}
          </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
