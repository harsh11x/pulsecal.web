"use client"

import { useRouter } from "next/navigation"
import { useEffect, Suspense, useState } from "react"
import nextDynamic from "next/dynamic"
import { store } from "@/app/store"

// Dynamically import dashboard pages to prevent static generation - client only
const PatientDashboardPage = nextDynamic(() => import("@/components/pages/dashboard/PatientDashboardPage"), { ssr: false })
const DoctorDashboardPage = nextDynamic(() => import("@/components/pages/dashboard/DoctorDashboardPage"), { ssr: false })
const ReceptionistDashboardPage = nextDynamic(() => import("@/components/pages/dashboard/ReceptionistDashboardPage"), { ssr: false })
const AdminDashboardPage = nextDynamic(() => import("@/components/pages/dashboard/AdminDashboardPage"), { ssr: false })

// Client-only component that uses Redux
function DashboardContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Only access Redux after component mounts
  useEffect(() => {
    // Ensure we're in the browser
    if (typeof window === "undefined") return

    // Get initial state
    const state = store.getState()
    setUser(state.auth.user)
    setIsLoading(state.auth.isLoading)

    // Subscribe to store changes
    const unsubscribe = store.subscribe(() => {
      const currentState = store.getState()
      setUser(currentState.auth.user)
      setIsLoading(currentState.auth.isLoading)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Only redirect if done loading and no user
    if (!isLoading && !user) {
      router.push("/auth/login")
    }

    // Only redirect to onboarding if user has no role or is explicitly incomplete
    // Don't block doctors who have completed payment/registration
    if (user && !user.role) {
      router.push(`/onboarding?role=patient`)
    }
  }, [user, router, isLoading])

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const renderDashboard = () => {
    switch (user.role.toLowerCase()) {
      case "patient":
        return <PatientDashboardPage user={user} />
      case "doctor":
        return <DoctorDashboardPage user={user} />
      case "receptionist":
        return <ReceptionistDashboardPage user={user} />
      case "admin":
        return <AdminDashboardPage user={user} />
      default:
        return <PatientDashboardPage user={user} />
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
