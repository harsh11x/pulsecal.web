"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { RealTimeBooking } from "@/components/appointments/RealTimeBooking"
import { apiService } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndianRupee } from "lucide-react"

export default function BookAppointmentPage() {
  const params = useParams()
  const doctorId = params?.id as string
  const [fee, setFee] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!doctorId) return
    setLoading(true)
    apiService.get(`/doctors/${doctorId}`).then((d: any) => {
      const profile = d?.doctorProfile ?? d
      const rawFee = profile?.consultationFee ?? d?.consultationFee
      const numFee = rawFee != null ? Number(rawFee) : null
      setFee(numFee !== null && !isNaN(numFee) ? numFee : 0)
    }).catch(() => setFee(0)).finally(() => setLoading(false))
  }, [doctorId])

  return (
    <div className="space-y-6">
      {/* Always show consultation fee prominently before booking */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            {loading ? "Loading..." : (fee != null && fee > 0)
              ? `Doctor's rate: ₹${fee} (pay to confirm appointment)`
              : "Free consultation"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
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

