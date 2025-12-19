"use client"

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

import { useAppSelector } from "@/app/hooks"
import { useRouter } from "next/navigation"
import { useEffect, Suspense } from "react"
import nextDynamic from "next/dynamic"

// Dynamically import dashboard pages to prevent static generation
const PatientDashboardPage = nextDynamic(() => import("@/pages/dashboard/PatientDashboardPage"), { ssr: false })
const DoctorDashboardPage = nextDynamic(() => import("@/pages/dashboard/DoctorDashboardPage"), { ssr: false })
const ReceptionistDashboardPage = nextDynamic(() => import("@/pages/dashboard/ReceptionistDashboardPage"), { ssr: false })
const AdminDashboardPage = nextDynamic(() => import("@/pages/dashboard/AdminDashboardPage"), { ssr: false })

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user)
  const router = useRouter()

  useEffect(() => {
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
  }, [user, router])

  if (!user) {
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
