"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/app/hooks"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Give Firebase auth state time to initialize
    const timer = setTimeout(() => {
      setIsLoading(false)

      if (!isAuthenticated || !user) {
        router.push("/auth/login")
      }
    }, 500) // Wait 500ms for auth state to rehydrate

    return () => clearTimeout(timer)
  }, [isAuthenticated, user, router])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If not authenticated after loading, don't render (redirect will happen)
  if (!isAuthenticated || !user) {
    return null
  }

  return <>{children}</>
}
