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

const isValidPhone = (phone: string) => /^\d{10}$/.test(phone)

export function RealTimeBooking({ doctorId, doctorName, consultationFee, onBookingSuccess }: RealTimeBookingProps) {
    const router = useRouter()
    const { token, user } = useAppSelector((state) => state.auth)
    const [days, setDays] = useState<DaySlots[]>([])
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [phone, setPhone] = useState(() => (user as any)?.phone?.replace(/\D/g, '').slice(0, 10) || "")
    const [reason, setReason] = useState("")
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
    }

    useEffect(() => {
        const userPhone = (user as any)?.phone
        if (userPhone && !phone) {
            setPhone(String(userPhone).replace(/\D/g, '').slice(0, 10))
        }
    }, [user])

    const generateFallbackSlots = (): DaySlots[] => {
        const result: DaySlots[] = []
        const now = new Date()
        const start = new Date(now)
        start.setHours(0, 0, 0, 0)
        const slotDuration = 30
        for (let d = 0; d < 14; d++) {
            const currentDay = new Date(start)
            currentDay.setDate(start.getDate() + d)
            let slotStart = new Date(currentDay)
            slotStart.setHours(9, 0, 0, 0)
            const slotEnd = new Date(currentDay)
            slotEnd.setHours(18, 0, 0, 0)
            if (d === 0 && slotStart < now) {
                const msPerSlot = slotDuration * 60 * 1000
                slotStart = new Date(Math.ceil(now.getTime() / msPerSlot) * msPerSlot)
                slotStart.setSeconds(0, 0)
            }
            const daySlots: Slot[] = []
            let cur = new Date(slotStart)
            while (cur < slotEnd && cur >= now) {
                cur.setSeconds(0, 0)
                daySlots.push({ time: cur.toISOString(), available: true })
                cur.setMinutes(cur.getMinutes() + slotDuration)
            }
            if (daySlots.length > 0) {
                result.push({
                    date: currentDay.toISOString().split("T")[0],
                    dayName: currentDay.toLocaleDateString("en-US", { weekday: "short" }),
                    slots: daySlots,
                    isFullyBooked: false,
                })
            }
        }
        return result
    }

    const fetchSlots = async () => {
        try {
            const data: any = await apiService.get(`/doctors/${doctorId}/slots?days=14`)
            const slotsArray = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.slots)
                        ? data.slots
                        : []
            if (slotsArray.length > 0) {
                setDays(slotsArray)
            } else {
                setDays(generateFallbackSlots())
            }
        } catch (error) {
            console.error("Failed to fetch slots, using fallback", error)
            setDays(generateFallbackSlots())
            toast.info("Showing available times. You can book below.")
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
        if (!isValidPhone(phone)) {
            toast.error("Please enter a valid 10-digit mobile number")
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
                    phone: phone.trim(),
                })
                toast.success("Appointment booked successfully!")
                setSelectedTime(null)
                setReason("")
                setNotes("")
                setPhone((user as any)?.phone?.replace(/\D/g, '').slice(0, 10) || "")
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
                phone: phone.trim(),
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
                        setPhone((user as any)?.phone?.replace(/\D/g, '').slice(0, 10) || "")
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

    if (days.length === 0) {
        return (
            <div className="p-6 text-center border rounded-lg bg-muted/30">
                <p className="text-muted-foreground font-medium">No availability at the moment</p>
                <p className="text-sm text-muted-foreground mt-1">The doctor may not have set their schedule yet. Please try again later or contact the clinic.</p>
            </div>
        )
    }

    return (
        <div className="space-y-5 sm:space-y-6">
            <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">Select Date</h3>
                <ScrollArea className="w-full whitespace-nowrap -mx-1 sm:mx-0">
                    <div className="flex w-max gap-2 sm:gap-2 pb-3 sm:pb-4 px-1">
                        {days.map((day) => (
                            <Button
                                key={day.date}
                                variant={selectedDate === day.date ? "default" : "outline"}
                                className={`h-16 sm:h-20 w-20 sm:w-24 flex-col gap-0.5 shrink-0 ${day.isFullyBooked ? "opacity-50" : ""}`}
                                onClick={() => !day.isFullyBooked && setSelectedDate(day.date)}
                                disabled={day.isFullyBooked}
                            >
                                <span className="text-[10px] sm:text-xs uppercase text-muted-foreground">
                                    {day.isFullyBooked ? "Full" : day.dayName}
                                </span>
                                <span className="text-lg sm:text-xl font-bold">{day.date.split('-')[2]}</span>
                            </Button>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            {selectedDate && selectedDaySlots && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="text-base sm:text-lg font-semibold mb-2">Select Time</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-1.5 sm:gap-2">
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
                <>
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 p-4 sm:p-4 border rounded-lg bg-accent/10 pb-36 sm:pb-4">
                        <div className="flex items-center gap-2 text-primary font-medium text-sm sm:text-base">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                                {format(new Date(selectedTime), "EEEE, MMM d 'at' h:mm a")}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm">Mobile Number *</Label>
                            <Input
                                type="tel"
                                placeholder="10-digit mobile number"
                                value={phone}
                                onChange={handlePhoneChange}
                                maxLength={10}
                                className={phone && !isValidPhone(phone) ? "border-destructive" : ""}
                            />
                            {phone && !isValidPhone(phone) && (
                                <p className="text-xs text-destructive">Must be exactly 10 digits</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm">Reason for Visit *</Label>
                            <Textarea
                                placeholder="Briefly describe your symptoms or reason for visit..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                                rows={3}
                                className="min-h-[72px] sm:min-h-0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm">Additional Notes (Optional)</Label>
                            <Textarea
                                placeholder="Any other information you want to share..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="min-h-[56px] sm:min-h-0"
                            />
                        </div>

                        <div className="rounded-lg bg-muted/50 p-3 text-sm">
                            <span className="font-medium">
                                {consultationFee != null && consultationFee > 0
                                    ? `Consultation fee: ₹${consultationFee} (pay now to confirm)`
                                    : "Free consultation"}
                            </span>
                            {consultationFee != null && consultationFee > 0 && (
                                <p className="text-muted-foreground text-xs mt-1">Pay via Razorpay to confirm your appointment.</p>
                            )}
                        </div>
                        {/* Desktop: inline button */}
                        <Button className="hidden sm:flex w-full" size="lg" onClick={handleBook} disabled={loading || !reason.trim() || !isValidPhone(phone)}>
                            {loading ? "Processing..." : consultationFee != null && consultationFee > 0
                                ? `Pay ₹${consultationFee} & Book`
                                : "Confirm Booking"}
                        </Button>
                    </div>

                    {/* Mobile: sticky bottom CTA bar (above MobileNav ~64px) */}
                    <div className="sm:hidden fixed bottom-16 left-0 right-0 z-40 p-4 pt-3 pb-3 bg-background/95 backdrop-blur border-t shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
                        <Button className="w-full" size="lg" onClick={handleBook} disabled={loading || !reason.trim() || !isValidPhone(phone)}>
                            {loading ? "Processing..." : consultationFee != null && consultationFee > 0
                                ? `Pay ₹${consultationFee} & Book`
                                : "Confirm Booking"}
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
