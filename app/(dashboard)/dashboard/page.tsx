"use client"

import { useAppSelector } from "@/app/hooks"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import PatientDashboardPage from "@/pages/dashboard/PatientDashboardPage"
import DoctorDashboardPage from "@/pages/dashboard/DoctorDashboardPage"
import ReceptionistDashboardPage from "@/pages/dashboard/ReceptionistDashboardPage"
import AdminDashboardPage from "@/pages/dashboard/AdminDashboardPage"

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
