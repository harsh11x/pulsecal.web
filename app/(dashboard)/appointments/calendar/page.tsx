"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AppointmentCalendar() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to appointments list for now
    router.push("/appointments/list")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}
