"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppSelector } from "@/app/hooks"
import { AppLayout } from "@/components/layout/AppLayout"
import { getAuthInstance } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const [isLoading, setIsLoading] = useState(true)
  const [firebaseAuthChecked, setFirebaseAuthChecked] = useState(false)

  useEffect(() => {
    // Check Firebase auth state directly
    try {
      const auth = getAuthInstance()
      
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setFirebaseAuthChecked(true)
        
        if (!firebaseUser) {
          // No Firebase user, redirect to login
          router.push("/auth/login")
          return
        }
        
        // Firebase user exists, check Redux state
        if (!isAuthenticated && !user) {
          // Give Redux a moment to update from AuthStateListener
          setTimeout(() => {
            setIsLoading(false)
          }, 1000)
        } else {
          setIsLoading(false)
        }
      })
      
      return () => unsubscribe()
    } catch (error) {
      console.warn("Failed to check Firebase auth:", error)
      // If Firebase check fails, rely on Redux state
      if (isAuthenticated && user) {
        setIsLoading(false)
      } else {
        router.push("/auth/login")
      }
    }
  }, [router, isAuthenticated, user])

  // Also check Redux state as fallback
  useEffect(() => {
    if (firebaseAuthChecked && isAuthenticated && user) {
      setIsLoading(false)
    }
  }, [firebaseAuthChecked, isAuthenticated, user])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <AppLayout>{children}</AppLayout>
}
