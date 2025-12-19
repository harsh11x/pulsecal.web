"use client"

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function CheckInAppointment({ params }: { params: { id: string } }) {
  const router = useRouter()

  useEffect(() => {
    router.push(`/appointments/${params.id}`)
  }, [params.id, router])

  return null
}

