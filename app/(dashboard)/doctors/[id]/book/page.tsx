"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { RealTimeBooking } from "@/components/appointments/RealTimeBooking"
import { apiService } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndianRupee } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function BookAppointmentPage() {
  const params = useParams()
  const doctorId = params?.id as string
  const [fee, setFee] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [doctor, setDoctor] = useState<any | null>(null)

  useEffect(() => {
    if (!doctorId) return
    setLoading(true)
    apiService.get(`/doctors/${doctorId}`).then((d: any) => {
      setDoctor(d)
      const profile = d?.doctorProfile ?? d
      const rawFee = profile?.consultationFee ?? d?.consultationFee
      const numFee = rawFee != null ? Number(rawFee) : null
      setFee(numFee !== null && !isNaN(numFee) ? numFee : 0)
    }).catch(() => setFee(0)).finally(() => setLoading(false))
  }, [doctorId])

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Always show consultation fee prominently before booking */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="py-3 sm:py-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {doctor && (
              <Avatar className="h-10 w-10">
                <AvatarImage src={doctor?.user?.profileImage || doctor?.profileImage} alt="Doctor" />
                <AvatarFallback>
                  {`Dr. ${doctor?.user?.firstName || doctor?.firstName || "D"}`.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-col gap-1">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <IndianRupee className="h-4 w-4 shrink-0" />
                {loading ? "Loading..." : (fee != null && fee > 0)
                  ? `Doctor's rate: ₹${fee} (pay to confirm)`
                  : "Free consultation"}
              </CardTitle>
              {doctor && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Dr. {doctor?.user?.firstName || doctor?.firstName} {doctor?.user?.lastName || doctor?.lastName} · {doctor?.doctorProfile?.specialization || doctor?.specialization}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {fee != null && fee > 0
              ? "Select date & time below, then pay via Razorpay to book."
              : "Select date & time below to book at no cost."}
          </p>
        </CardHeader>
      </Card>
      <RealTimeBooking doctorId={doctorId} consultationFee={fee ?? undefined} />
    </div>
  )
}

