"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Provider, useDispatch } from "react-redux"
import { store } from "./store"
import { useState, useEffect } from "react"
import { onIdTokenChanged, User } from "firebase/auth"
import { getAuthInstance } from "@/lib/firebase"
import { getIdToken } from "@/lib/firebaseAuth"
import { apiService } from "@/services/api"
import { setUser, logout, setLoading } from "./features/authSlice"

function AuthStateListener({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()

  useEffect(() => {
    try {
      const auth = getAuthInstance()

      // Wait a bit for Firebase to initialize
      const initTimeout = setTimeout(() => {
        // Use onIdTokenChanged to catch token refreshes as well as sign-in/out
        const unsubscribe = onIdTokenChanged(auth, async (firebaseUser: User | null) => {
          if (firebaseUser) {
            // User is signed in or token refreshed
            try {
              // Get the token directly from the user object
              const token = await firebaseUser.getIdToken()

              if (token) {
                // Update default headers for all future requests
                // This is critical for ensuring seamless requests after refresh
                // @ts-ignore - Accessing private property or using axios default headers access
                if (apiService['api']) {
                  apiService['api'].defaults.headers.common["Authorization"] = `Bearer ${token}`
                }

                try {
                  const profileResponse: any = await apiService.get("/auth/profile")
                  // apiService unwraps responses, so profileResponse is the data directly
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
                } catch (error) {
                  console.warn("Failed to fetch user profile on auth state change:", error)

                  // Fallback: Get role from ID token claims
                  let firebaseRole = "patient";
                  try {
                    // Force refresh to ensure we get the latest claims
                    const idTokenResult = await firebaseUser.getIdTokenResult();
                    if (idTokenResult.claims.role) {
                      firebaseRole = (idTokenResult.claims.role as string).toLowerCase();
                    }
                  } catch (e) {
                    console.error("Failed to get ID token result:", e);
                  }

                  // Don't logout if backend is unavailable - create minimal user from Firebase
                  const userData = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email || "",
                    firstName: firebaseUser.displayName?.split(" ")[0] || "User",
                    lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
                    role: firebaseRole as "patient" | "doctor" | "receptionist" | "admin",
                    isActive: true,
                    isEmailVerified: firebaseUser.emailVerified || false,
                    profileImage: firebaseUser.photoURL || undefined,
                    onboardingCompleted: false, // Default to false if we can't reach backend
                  }
                  dispatch(setUser(userData))
                }
              }
            } catch (error) {
              console.warn("Failed to get token on auth state change:", error)
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
        })

        return () => {
          clearTimeout(initTimeout)
          unsubscribe()
        }
      }, 100)

      return () => clearTimeout(initTimeout)
    } catch (error) {
      console.warn("Failed to set up auth state listener:", error)
      dispatch(setLoading(false))
    }
  }, [dispatch])

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
