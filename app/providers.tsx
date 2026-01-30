"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Provider, useDispatch } from "react-redux"
import { store } from "./store"
import { useState, useEffect } from "react"
import { onIdTokenChanged, User } from "firebase/auth"
import { apiService } from "@/services/api"
import { setUser, logout, setLoading } from "./features/authSlice"

function AuthStateListener({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === "undefined") {
      dispatch(setLoading(false))
      return
    }

    let unsubscribe: (() => void) | undefined
    let initTimeout: NodeJS.Timeout | undefined

    const initializeAuth = async () => {
      try {
        // Dynamically import Firebase to prevent SSR issues
        const { getAuthInstance } = await import("@/lib/firebase")
        
        let auth
        try {
          auth = getAuthInstance()
        } catch (firebaseError: any) {
          console.error("Firebase initialization error:", firebaseError)
          setAuthError("Authentication service unavailable. Please refresh the page.")
          dispatch(setLoading(false))
          return
        }

        // Wait a bit for Firebase to fully initialize
        initTimeout = setTimeout(() => {
          try {
            // Use onIdTokenChanged to catch token refreshes as well as sign-in/out
            unsubscribe = onIdTokenChanged(auth, async (firebaseUser: User | null) => {
              if (firebaseUser) {
                // User is signed in or token refreshed - retry token a few times (patient login can be slow)
                let token: string | null = null
                for (let attempt = 0; attempt < 3; attempt++) {
                  try {
                    token = await firebaseUser.getIdToken(attempt > 0)
                    if (token) break
                  } catch (e) {
                    if (attempt === 2) {
                      console.warn("Failed to get token after retries:", e)
                      dispatch(setLoading(false))
                      return
                    }
                    await new Promise((r) => setTimeout(r, 400))
                  }
                }

                if (token) {
                  // Update default headers for all future requests
                  // @ts-ignore - Accessing private property
                  if (apiService['api']) {
                    apiService['api'].defaults.headers.common["Authorization"] = `Bearer ${token}`
                  }

                  try {
                    const profileResponse: any = await apiService.get("/auth/profile")
                    const userProfile = profileResponse

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
                    }
                  } catch (profileError: any) {
                    console.warn("Failed to fetch user profile:", profileError?.message || profileError)

                    // Fallback: use minimal user from Firebase so patient can still reach dashboard
                    let firebaseRole = "patient"
                    try {
                      const idTokenResult = await firebaseUser.getIdTokenResult()
                      if (idTokenResult.claims.role) {
                        firebaseRole = (idTokenResult.claims.role as string).toLowerCase()
                      }
                    } catch (e) {
                      console.error("Failed to get ID token result:", e)
                    }

                    const userData = {
                      id: firebaseUser.uid,
                      email: firebaseUser.email || "",
                      firstName: firebaseUser.displayName?.split(" ")[0] || "User",
                      lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
                      role: firebaseRole as "patient" | "doctor" | "receptionist" | "admin",
                      isActive: true,
                      isEmailVerified: firebaseUser.emailVerified || false,
                      profileImage: firebaseUser.photoURL || undefined,
                      onboardingCompleted: false,
                    }
                    dispatch(setUser(userData))
                  }
                }
              } else {
                // User is signed out
                dispatch(logout())
                // Clear headers
                if (apiService['api']) {
                  delete apiService['api'].defaults.headers.common["Authorization"]
                }
              }
              // Auth check completed
              dispatch(setLoading(false))
              setAuthError(null)
            })
          } catch (listenerError) {
            console.error("Auth listener setup failed:", listenerError)
            dispatch(setLoading(false))
          }
        }, 100)
      } catch (error) {
        console.error("Auth initialization failed:", error)
        dispatch(setLoading(false))
      }
    }

    initializeAuth()

    return () => {
      if (initTimeout) clearTimeout(initTimeout)
      if (unsubscribe) unsubscribe()
    }
  }, [dispatch])

  // Show error state if auth failed
  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthStateListener>{children}</AuthStateListener>
      </QueryClientProvider>
    </Provider>
  )
}
