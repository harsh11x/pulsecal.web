"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function CheckInAppointment({ params }: { params: { id: string } }) {
  const router = useRouter()

  useEffect(() => {
    router.push(`/appointments/${params.id}`)
  }, [params.id, router])

  return null
}

