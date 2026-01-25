
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, MapPin, User, Loader2, CreditCard } from "lucide-react"
import { apiService } from "@/services/api"
import { format } from "date-fns"
import { useAppSelector } from "@/app/hooks"
import { formatCurrency } from "@/utils/helpers"
import { toast } from "sonner"

export default function AppointmentDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAppSelector((state) => state.auth)
  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    fetchAppointment()
  }, [params.id])

  const fetchAppointment = async () => {
    try {
      const response: any = await apiService.get(`/appointments/${params.id}`)
      setAppointment(response?.data || response)
    } catch (error) {
      console.error("Failed to fetch appointment:", error)
      toast.error("Failed to load appointment details")
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setProcessingPayment(true)
    try {
      // 1. Initiate Payment Order
      const orderResponse: any = await apiService.post("/payments/create-order", {
        appointmentId: appointment.id,
        amount: appointment.doctor?.consultationFee || 500 // Fallback or fetch from payment/doctor
      })

      const options = {
        key: orderResponse.data.key_id, // Ensure backend sends this
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "PulseCal Medical",
        description: "Consultation Fee",
        order_id: orderResponse.data.id,
        handler: async (response: any) => {
          // 2. Verify Payment
          try {
            await apiService.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            toast.success("Payment successful!")
            fetchAppointment() // Refresh to see updated status
          } catch (verifyError) {
            toast.error("Payment verification failed")
          }
        },
        theme: {
          color: "#0F172A"
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to initiate payment")
    } finally {
      setProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">Appointment not found</p>
      </div>
    )
  }

  const isPatient = (user?.role as string) === 'PATIENT';
  const showPayButton = isPatient && appointment.paymentStatus === 'PENDING' && appointment.status !== 'CANCELLED';

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Appointment Details</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                Status:
                <Badge variant={appointment.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                  {appointment.status}
                </Badge>
              </CardDescription>
            </div>
            {showPayButton && (
              <Button onClick={handlePayment} disabled={processingPayment}>
                {processingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pay Now
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Doctor/Patient Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                {isPatient ? "Doctor" : "Patient"}
              </h3>
              {isPatient ? (
                <>
                  <p className="text-lg font-medium">Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}</p>
                  <p className="text-muted-foreground">{appointment.doctor?.specialization}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">{appointment.patient?.firstName} {appointment.patient?.lastName}</p>
                  <p className="text-muted-foreground">{appointment.patient?.phone}</p>
                </>
              )}
            </div>

            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </h3>
              <p className="text-lg font-medium">{format(new Date(appointment.scheduledAt), "EEEE, MMMM d, yyyy")}</p>
              <p className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(appointment.scheduledAt), "h:mm a")} ({appointment.duration} mins)
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border p-4 rounded-lg bg-muted/20">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Info
            </h3>
            <div className="flex justify-between items-center">
              <span>Consultation Fee</span>
              <span className="font-bold">{formatCurrency(appointment.doctor?.consultationFee || 0)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span>Payment Status</span>
              <Badge variant={appointment.paymentStatus === 'COMPLETED' ? 'outline' : 'destructive'}>
                {appointment.paymentStatus || 'PENDING'}
              </Badge>
            </div>
          </div>

          {/* Notes/Reason */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Reason for Visit</h3>
              <p className="text-muted-foreground bg-muted p-3 rounded-md">{appointment.reason || "No reason provided."}</p>
            </div>
            {appointment.notes && (
              <div>
                <h3 className="font-semibold mb-1">Notes</h3>
                <p className="text-muted-foreground">{appointment.notes}</p>
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
