"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Clock, X, Plus, Save } from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import { format, addDays, isSameDay } from "date-fns"

interface TimeSlot {
  id?: string
  startTime: string
  endTime: string
  isAvailable: boolean
  isBlocked: boolean
}

interface DaySchedule {
  date: Date
  slots: TimeSlot[]
}

export default function DoctorScheduleManager() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [schedules, setSchedules] = useState<DaySchedule[]>([])
  const [workingHours, setWorkingHours] = useState({
    start: "09:00",
    end: "17:00",
  })
  const [slotDuration, setSlotDuration] = useState(30) // minutes
  const [blockedSlots, setBlockedSlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    fetchSchedule()
  }, [selectedDate])

  const fetchSchedule = async () => {
    try {
      const response: any = await apiService.get(`/api/v1/doctors/schedule?date=${format(selectedDate, "yyyy-MM-dd")}`)
      if (response?.data) {
        // Process schedule data
      }
    } catch (error) {
      console.warn("Failed to fetch schedule:", error)
    }
  }

  const generateTimeSlots = (start: string, end: string, duration: number): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const [startHour, startMin] = start.split(":").map(Number)
    const [endHour, endMin] = end.split(":").map(Number)
    
    let currentHour = startHour
    let currentMin = startMin
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const slotStart = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`
      
      currentMin += duration
      if (currentMin >= 60) {
        currentMin -= 60
        currentHour += 1
      }
      
      const slotEnd = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`
      
      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        isAvailable: true,
        isBlocked: false,
      })
    }
    
    return slots
  }

  const handleBlockSlot = (slot: TimeSlot) => {
    setBlockedSlots([...blockedSlots, { ...slot, isBlocked: true }])
    toast.success("Time slot blocked")
  }

  const handleUnblockSlot = (slotId: string) => {
    setBlockedSlots(blockedSlots.filter((s) => s.id !== slotId))
    toast.success("Time slot unblocked")
  }

  const handleSaveSchedule = async () => {
    try {
      await apiService.post("/api/v1/doctors/schedule", {
        date: format(selectedDate, "yyyy-MM-dd"),
        workingHours,
        slotDuration,
        blockedSlots,
      })
      toast.success("Schedule saved successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to save schedule")
    }
  }

  const slots = generateTimeSlots(workingHours.start, workingHours.end, slotDuration)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Schedule Management</CardTitle>
          <CardDescription>Manage your availability and time slots</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Working Hours Start</Label>
              <Input
                type="time"
                value={workingHours.start}
                onChange={(e) => setWorkingHours({ ...workingHours, start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Working Hours End</Label>
              <Input
                type="time"
                value={workingHours.end}
                onChange={(e) => setWorkingHours({ ...workingHours, end: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Slot Duration (minutes)</Label>
              <Select value={slotDuration.toString()} onValueChange={(v) => setSlotDuration(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Time Slots for {format(selectedDate, "MMMM d, yyyy")}</h3>
              <Button onClick={handleSaveSchedule}>
                <Save className="mr-2 h-4 w-4" />
                Save Schedule
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              {slots.map((slot, index) => {
                const isBlocked = blockedSlots.some(
                  (b) => b.startTime === slot.startTime && b.endTime === slot.endTime
                )
                return (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg flex items-center justify-between ${
                      isBlocked ? "bg-muted" : "bg-background"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                    {isBlocked ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnblockSlot(slot.id || index.toString())}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleBlockSlot(slot)}>
                        Block
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

