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

  useEffect(() => {
    if (!doctorId) return
    apiService.get(`/doctors/${doctorId}`).then((d: any) => {
      const profile = d?.doctorProfile ?? d
      setFee(profile?.consultationFee != null ? Number(profile.consultationFee) : null)
    }).catch(() => {})
  }, [doctorId])

  return (
    <div className="space-y-6">
      {fee != null && fee > 0 && (
        <Card className="border-primary/30">
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Consultation fee: ₹{fee}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Payment is required to confirm your appointment.</p>
          </CardHeader>
        </Card>
      )}
      <RealTimeBooking doctorId={doctorId} consultationFee={fee ?? undefined} />
    </div>
  )
}

