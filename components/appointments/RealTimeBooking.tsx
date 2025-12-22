"use client"

import { useState, useEffect } from "react"
import { format, addDays, isSameDay } from "date-fns"
import { Calendar as CalendarIcon, Clock, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { useAppSelector } from "@/app/hooks"
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
    const { token, user } = useAppSelector((state) => state.auth)
    const [days, setDays] = useState<DaySlots[]>([])
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    const fetchSlots = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/doctors/${doctorId}/slots?days=10`, {
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

        // Connect to /notifications namespace with auth
        const socket = io(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/notifications`, {
            auth: {
                token: token
            }
        })

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
        if (!selectedDate || !selectedTime || !reason) return

        setLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/appointments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    doctorId,
                    scheduledAt: selectedTime,
                    reason,
                    type: "IN_PERSON" // Default
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || "Booking failed")

            toast.success("Appointment booked successfully!")
            setSelectedTime(null)
            setReason("")
            onBookingSuccess?.()
            fetchSlots() // Refresh

        } catch (error: any) {
            toast.error(error.message)
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
                        <Label>Reason for Visit</Label>
                        <Textarea
                            placeholder="Briefly describe your symptoms or reason for visit..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <Button className="w-full" size="lg" onClick={handleBook} disabled={loading || !reason}>
                        {loading ? "Booking..." : `Confirm Booking ${consultationFee ? `(₹${consultationFee})` : ""}`}
                    </Button>
                </div>
            )}
        </div>
    )
}
