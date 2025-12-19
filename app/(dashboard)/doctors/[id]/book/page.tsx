"use client"

import { useParams } from "next/navigation"
import { AppointmentBooking } from "@/components/appointments/AppointmentBooking"

export default function BookAppointmentPage() {
  const params = useParams()
  const doctorId = params.id as string

  return <AppointmentBooking doctorId={doctorId} />
}

