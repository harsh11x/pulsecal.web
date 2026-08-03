"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, User, Loader2, CreditCard, Phone, FileText } from "lucide-react"
import { apiService } from "@/services/api"
import { format } from "date-fns"
import { useAppSelector } from "@/app/hooks"
import { formatCurrency } from "@/utils/helpers"
import { toast } from "sonner"
import { AddMedicalRecordDialog, type MedicalRecordPrefill } from "@/components/medical-records/AddMedicalRecordDialog"

export default function AppointmentDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { user } = useAppSelector((state) => state.auth)
  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [notePrefill, setNotePrefill] = useState<MedicalRecordPrefill | null>(null)

  useEffect(() => {
    if (id) fetchAppointment()
  }, [id])

  const fetchAppointment = async () => {
    if (!id) return
    try {
      const response: any = await apiService.get(`/appointments/${id}`)
      const apt = response?.data ?? response?.appointment ?? response

      if (!apt) {
        throw new Error("Appointment data missing")
      }

      setAppointment(apt && typeof apt === "object" && apt.id ? apt : null)
    } catch (error: any) {
      console.error("Failed to fetch appointment:", error)
      const errorMessage = error.response?.data?.message || error.message || "Failed to load appointment details"
      const statusCode = error.response?.status

      toast.error(`Error ${statusCode ? `(${statusCode})` : ""}: ${errorMessage}`)
      setAppointment(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setProcessingPayment(true)
    try {
      const amount = appointment.doctor?.consultationFee ?? 500
      const orderResponse: any = await apiService.post("/payments/create-order", {
        appointmentId: appointment.id,
        amount,
        currency: "INR",
      })

      const options = {
        key: orderResponse.key || orderResponse.key_id,
        amount: orderResponse.amount,
        currency: orderResponse.currency || "INR",
        name: "PulseCal Medical",
        description: "Consultation Fee",
        order_id: orderResponse.id || orderResponse.orderId,
        handler: async (response: any) => {
          try {
            await apiService.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success("Payment successful!")
            fetchAppointment()
          } catch (verifyError: any) {
            toast.error(verifyError.message || "Payment verification failed")
          }
        },
        theme: { color: "#0F172A" },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on("payment.failed", (err: any) => {
        toast.error(err.error?.description || "Payment failed. Please try again.")
        setProcessingPayment(false)
      })
      rzp.open()
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Failed to initiate payment")
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
      <div className="container mx-auto py-8 flex flex-col items-center justify-center gap-4">
        <p className="text-center text-muted-foreground text-lg">Appointment not found</p>
        <p className="text-sm text-muted-foreground">ID: {id}</p>
        <Button onClick={() => router.push("/appointments/list")} variant="outline">
          Back to Appointments
        </Button>
      </div>
    )
  }

  const isPatient = (user?.role as string)?.toLowerCase() === "patient"
  const isDoctor = (user?.role as string)?.toLowerCase() === "doctor"
  const showPayButton = isPatient && appointment.paymentStatus === "PENDING" && appointment.status !== "CANCELLED"

  const openClinicalNote = () => {
    const patientName = `${appointment.patient?.firstName || ""} ${appointment.patient?.lastName || ""}`.trim()
    setNotePrefill({
      appointmentId: appointment.id,
      patientId: appointment.patientId || appointment.patient?.id,
      patientName: patientName || undefined,
      patientPhone: appointment.patient?.phone,
      visitDate: appointment.scheduledAt,
      reason: appointment.reason || undefined,
    })
    setNoteDialogOpen(true)
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-3">
            <div>
              <CardTitle className="text-2xl">Appointment Details</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                Status:
                <Badge variant={appointment.status === "CONFIRMED" ? "default" : "secondary"}>
                  {appointment.status}
                </Badge>
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {isDoctor && (
                <Button variant="outline" onClick={openClinicalNote}>
                  <FileText className="mr-2 h-4 w-4" />
                  Add clinical note
                </Button>
              )}
              {showPayButton && (
                <Button onClick={handlePayment} disabled={processingPayment}>
                  {processingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Pay Now
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                {isPatient ? "Doctor" : "Patient"}
              </h3>
              {isPatient ? (
                <>
                  <p className="text-lg font-medium">
                    Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                  </p>
                  <p className="text-muted-foreground">{appointment.doctor?.specialization}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">
                    {appointment.patient?.firstName} {appointment.patient?.lastName}
                  </p>
                  {(appointment.patient?.phone || (appointment as any).patientPhone) && (
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      {appointment.patient?.phone || (appointment as any).patientPhone}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </h3>
              <p className="text-lg font-medium">
                {format(new Date(appointment.scheduledAt), "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(appointment.scheduledAt), "h:mm a")} ({appointment.duration} mins)
              </p>
            </div>

            {isPatient && (appointment.patient?.phone || (appointment as any).patientPhone) && (
              <div className="border p-4 rounded-lg md:col-span-2">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Your contact
                </h3>
                <p className="text-lg font-medium">
                  {appointment.patient?.phone || (appointment as any).patientPhone}
                </p>
              </div>
            )}
          </div>

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
              <Badge variant={appointment.paymentStatus === "COMPLETED" ? "outline" : "destructive"}>
                {appointment.paymentStatus || "PENDING"}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Reason for Visit</h3>
              <p className="text-muted-foreground bg-muted p-3 rounded-md">
                {appointment.reason || "No reason provided."}
              </p>
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

      <AddMedicalRecordDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        onSuccess={() => toast.success("Clinical note linked to this appointment")}
        prefill={notePrefill}
      />
    </div>
  )
}
