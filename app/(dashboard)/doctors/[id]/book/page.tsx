"use client"

import { useParams } from "next/navigation"
import { RealTimeBooking } from "@/components/appointments/RealTimeBooking"

export default function BookAppointmentPage() {
  const params = useParams()
  const doctorId = params?.id as string

  return <RealTimeBooking doctorId={doctorId} />
}

