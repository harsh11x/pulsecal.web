"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppSelector } from "@/app/hooks"
import { useAutoLogout } from "@/hooks/useAutoLogout"
import { AppLayout } from "@/components/layout/AppLayout"
import { getAuthInstance } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Auto-logout after 15 minutes of inactivity
  useAutoLogout()

  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Only redirect if done loading and not authenticated
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push("/auth/login")
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <AppLayout>{children}</AppLayout>
}
