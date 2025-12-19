"use client"

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'
export const dynamicParams = true

import { useRouter } from "next/navigation"
import { useEffect, Suspense, useState } from "react"
import nextDynamic from "next/dynamic"
import { store } from "@/app/store"

// Dynamically import dashboard pages to prevent static generation - client only
const PatientDashboardPage = nextDynamic(() => import("@/pages/dashboard/PatientDashboardPage"), { ssr: false })
const DoctorDashboardPage = nextDynamic(() => import("@/pages/dashboard/DoctorDashboardPage"), { ssr: false })
const ReceptionistDashboardPage = nextDynamic(() => import("@/pages/dashboard/ReceptionistDashboardPage"), { ssr: false })
const AdminDashboardPage = nextDynamic(() => import("@/pages/dashboard/AdminDashboardPage"), { ssr: false })

// Client-only component that uses Redux
function DashboardContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)

  // Only access Redux after component mounts
  useEffect(() => {
    // Ensure we're in the browser
    if (typeof window === "undefined") return
    
    // Get initial state
    const state = store.getState()
    setUser(state.auth.user)
    setIsReady(true)
    
    // Subscribe to store changes
    const unsubscribe = store.subscribe(() => {
      const currentState = store.getState()
      setUser(currentState.auth.user)
    })
    
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!isReady) return
    
    if (!user) {
      // Give a small delay to allow Redux state to update
      const timer = setTimeout(() => {
        router.push("/auth/login")
      }, 500)
      return () => clearTimeout(timer)
    }

    // Check if onboarding is completed
    if (user && !user.onboardingCompleted) {
      router.push(`/onboarding?role=${user.role}`)
    }
  }, [user, router, isReady])

  if (!isReady || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Check if onboarding is completed
  if (!user.onboardingCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const renderDashboard = () => {
    switch (user.role.toLowerCase()) {
      case "patient":
        return <PatientDashboardPage />
      case "doctor":
        return <DoctorDashboardPage />
      case "receptionist":
        return <ReceptionistDashboardPage />
      case "admin":
        return <AdminDashboardPage />
      default:
        return <PatientDashboardPage />
    }
  }

  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      {renderDashboard()}
    </Suspense>
  )
}

// Main page component - ensures client-side only rendering
export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
