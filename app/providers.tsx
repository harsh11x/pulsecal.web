"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Provider, useDispatch } from "react-redux"
import { store } from "./store"
import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
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
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // User is signed in, fetch profile from backend
            try {
              // Wait a moment for token to be available
              await new Promise(resolve => setTimeout(resolve, 300))

              const token = await getIdToken()
              if (token) {
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
                  }
                } catch (error) {
                  console.warn("Failed to fetch user profile on auth state change:", error)

                  // Fallback: Get role from ID token claims
                  let firebaseRole = "patient";
                  try {
                    const idTokenResult = await firebaseUser.getIdTokenResult();
                    if (idTokenResult.claims.role) {
                      firebaseRole = (idTokenResult.claims.role as string).toLowerCase();
                      console.log("Using role from Firebase claims:", firebaseRole);
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
