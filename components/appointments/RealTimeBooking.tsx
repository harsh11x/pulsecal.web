"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { useAppSelector } from "@/app/hooks"
import { apiService } from "@/services/api"
import { io } from "socket.io-client"

interface Slot {
    time: string
    available: boolean
}

interface DaySlots {
    date: string
    dayName: string
    slots: Slot[]
    isFullyBooked: boolean
}

interface RealTimeBookingProps {
    doctorId: string
    doctorName?: string
    consultationFee?: number
    onBookingSuccess?: () => void
}

export function RealTimeBooking({ doctorId, doctorName, consultationFee, onBookingSuccess }: RealTimeBookingProps) {
    const router = useRouter()
    const { token, user } = useAppSelector((state) => state.auth)
    const [days, setDays] = useState<DaySlots[]>([])
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [reason, setReason] = useState("")
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    const fetchSlots = async () => {
        try {
            // Use relative path to go through Next.js proxy (HTTPS)
            const res = await fetch(`/api/v1/doctors/${doctorId}/slots?days=10`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setDays(data.data || [])
            }
        } catch (error) {
            console.error("Failed to fetch slots", error)
        } finally {
            setFetching(false)
        }
    }

    useEffect(() => {
        fetchSlots()

        if (!token) return

        // Check if we can use sockets (must have HTTPS backend when frontend is HTTPS)
        const isHttps = window.location.protocol === 'https:'
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL
        
        if (isHttps && backendUrl && backendUrl.startsWith('http://')) {
            console.warn("[RealTimeBooking] Frontend is HTTPS but backend is HTTP. Socket connections disabled.")
            return // Don't connect sockets if there's a mixed content issue
        }
        
        // Use HTTPS backend URL if available
        let socketUrl: string
        if (backendUrl && backendUrl.startsWith('https://')) {
            socketUrl = `${backendUrl.replace(/\/$/, '')}/notifications`
        } else {
            // Try relative path (may not work for WebSockets)
            socketUrl = "/api/v1/notifications"
            console.warn("[RealTimeBooking] Using relative path - may not work. Configure HTTPS backend.")
        }
        
        console.log(`[RealTimeBooking] Connecting socket to: ${socketUrl}`)
        
        const socket = io(socketUrl, {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling'],
            autoConnect: backendUrl?.startsWith('https://') || false, // Only auto-connect if HTTPS
        })
        
        // Only connect if we have HTTPS
        if (backendUrl && backendUrl.startsWith('https://')) {
            socket.connect()
        } else {
            console.warn("[RealTimeBooking] Not connecting socket - backend must use HTTPS")
            return
        }

        socket.on('connect', () => {
            socket.emit('join_doctor_slots', doctorId)
        })

        // Listen for slot booking events (public)
        socket.on('slot:booked', (data: any) => {
            if (data.doctorId === doctorId) {
                // Refetch to ensure up-to-date state
                fetchSlots()
                toast.info("A slot was newly booked")
            }
        })

        return () => {
            socket.emit('leave_doctor_slots', doctorId)
            socket.disconnect()
        }
    }, [doctorId, token])

    const handleBook = async () => {
        if (!selectedDate || !selectedTime || !reason.trim()) {
            toast.error("Please select date, time and provide reason for visit")
            return
        }

        const fee = consultationFee ?? 0

        setLoading(true)
        try {
            if (fee <= 0) {
                // Free consultation - create appointment directly
                const res: any = await apiService.post("/appointments/self", {
                    doctorId,
                    scheduledAt: selectedTime,
                    reason: reason.trim(),
                    notes: notes.trim() || undefined,
                })
                toast.success("Appointment booked successfully!")
                setSelectedTime(null)
                setReason("")
                setNotes("")
                onBookingSuccess?.()
                fetchSlots()
                if (res?.id) router.push(`/appointments/${res.id}`)
                setLoading(false)
                return
            }

            // Paid consultation: create order -> Razorpay -> verify
            const orderRes: any = await apiService.post("/payments/appointment/create-order", {
                doctorId,
                scheduledAt: selectedTime,
                reason: reason.trim(),
                notes: notes.trim() || undefined,
                amount: fee,
            })

            if (!(window as any).Razorpay) {
                toast.error("Payment gateway failed to load. Please refresh the page.")
                setLoading(false)
                return
            }

            const options = {
                key: orderRes.key,
                amount: orderRes.amount,
                currency: orderRes.currency || "INR",
                name: "PulseCal",
                description: "Consultation Fee",
                order_id: orderRes.orderId,
                handler: async (response: any) => {
                    try {
                        const verifyRes: any = await apiService.post("/payments/appointment/verify", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                        toast.success("Appointment booked successfully!")
                        setSelectedTime(null)
                        setReason("")
                        setNotes("")
                        onBookingSuccess?.()
                        fetchSlots()
                        if (verifyRes?.appointment?.id) {
                            router.push(`/appointments/${verifyRes.appointment.id}`)
                        }
                    } catch (err: any) {
                        toast.error(err.message || "Payment verification failed. Please contact support.")
                    } finally {
                        setLoading(false)
                    }
                },
                theme: { color: "#0F172A" }
            }

            const rzp = new (window as any).Razorpay(options)
            rzp.on("payment.failed", (err: any) => {
                toast.error(err.error?.description || "Payment failed. Please try again.")
                setLoading(false)
            })
            rzp.open()
        } catch (error: any) {
            const msg = error.response?.data?.message || error.response?.data?.error || error.message || "Booking failed"
            toast.error(msg)
            console.error("Booking error:", error?.response?.data || error)
        } finally {
            setLoading(false)
        }
    }

    const selectedDaySlots = days.find(d => d.date === selectedDate)

    if (fetching) return <div className="p-4 text-center">Loading availability...</div>

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Select Date</h3>
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max space-x-2 pb-4">
                        {days.map((day) => (
                            <Button
                                key={day.date}
                                variant={selectedDate === day.date ? "default" : "outline"}
                                className={`h-20 w-24 flex-col gap-1 ${day.isFullyBooked ? "opacity-50" : ""}`}
                                onClick={() => !day.isFullyBooked && setSelectedDate(day.date)}
                                disabled={day.isFullyBooked}
                            >
                                <span className="text-xs uppercase text-muted-foreground">
                                    {day.isFullyBooked ? "Full" : day.dayName}
                                </span>
                                <span className="text-xl font-bold">{day.date.split('-')[2]}</span>
                            </Button>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            {selectedDate && selectedDaySlots && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="text-lg font-semibold mb-2">Select Time</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {selectedDaySlots.slots.map((slot) => {
                            const timeLabel = new Date(slot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            return (
                                <Button
                                    key={slot.time}
                                    variant={selectedTime === slot.time ? "default" : slot.available ? "outline" : "ghost"}
                                    disabled={!slot.available}
                                    onClick={() => setSelectedTime(slot.time)}
                                    className={`text-sm ${!slot.available && "text-muted-foreground bg-muted strike-through"}`}
                                >
                                    {timeLabel}
                                </Button>
                            )
                        })}
                    </div>
                </div>
            )}

            {selectedTime && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 p-4 border rounded-lg bg-accent/10">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <Clock className="h-4 w-4" />
                        <span>
                            {format(new Date(selectedTime), "EEEE, MMMM d 'at' h:mm a")}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <Label>Reason for Visit *</Label>
                        <Textarea
                            placeholder="Briefly describe your symptoms or reason for visit..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Additional Notes (Optional)</Label>
                        <Textarea
                            placeholder="Any other information you want to share..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="rounded-lg bg-muted/50 p-3 text-sm">
                        <span className="font-medium">
                            {consultationFee != null && consultationFee > 0
                                ? `Consultation fee: ₹${consultationFee} (pay now to confirm)`
                                : "Free consultation"}
                        </span>
                        {consultationFee != null && consultationFee > 0 && (
                            <p className="text-muted-foreground text-xs mt-1">Click below to pay via Razorpay. Appointment is confirmed only after successful payment.</p>
                        )}
                    </div>
                    <Button className="w-full" size="lg" onClick={handleBook} disabled={loading || !reason.trim()}>
                        {loading ? "Processing..." : consultationFee != null && consultationFee > 0
                            ? `Pay ₹${consultationFee} & Book`
                            : "Confirm Booking"}
                    </Button>
                </div>
            )}
        </div>
    )
}
