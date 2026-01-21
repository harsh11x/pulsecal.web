"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/app/hooks"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Only redirect if done loading and not authenticated
    if (!isLoading && (!isAuthenticated || !user)) {
      window.location.href = "https://pulsecal.com"
      return
    }

    // Role check
    if (!isLoading && user && allowedRoles) {
      if (!allowedRoles.includes(user.role)) {
        router.push('/dashboard') // Or unauthorized page
      }
    }
  }, [isLoading, isAuthenticated, user, router, allowedRoles])

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

  // Role restriction render check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
