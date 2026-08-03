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
    breakStart: "",
    breakEnd: "",
  })
  const [slotDuration, setSlotDuration] = useState(30) // minutes
  const [blockedSlots, setBlockedSlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    fetchProfile()
    fetchSchedule()
  }, [selectedDate])

  const fetchProfile = async () => {
    try {
      const response: any = await apiService.get(`/doctor-profiles/me`)
      const profile = response
      // Handle profile.workingHours being null or undefined
      const workingHoursData = profile?.workingHours || {};

      // Try to get settings from defaultSettings first (most recent save), then fall back to day-specific
      const defaults = workingHoursData.defaultSettings;

      if (defaults) {
        if (defaults.workingHours) {
          setWorkingHours({
            start: defaults.workingHours.start,
            end: defaults.workingHours.end,
            breakStart: defaults.workingHours.breakStart || "",
            breakEnd: defaults.workingHours.breakEnd || "",
          })
        }
        if (defaults.slotDuration) {
          setSlotDuration(defaults.slotDuration)
        }
      } else if (Object.keys(workingHoursData).length > 0) {
        // Find working hours for the selected day if legacy format or just no defaults
        const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        const daySchedule = workingHoursData[dayName]
        if (daySchedule) {
          setWorkingHours({
            start: daySchedule.start,
            end: daySchedule.end,
            breakStart: daySchedule.breakStart || "",
            breakEnd: daySchedule.breakEnd || "",
          })
        }
      } else {
        // Fallback if no workingHours set at all
        setWorkingHours({ start: "09:00", end: "17:00", breakStart: "", breakEnd: "" });
        setSlotDuration(30);
      }

      // Load blocked slots for this date
      const dateKey = format(selectedDate, "yyyy-MM-dd")
      if (workingHoursData.exceptions && workingHoursData.exceptions[dateKey]) {
        const savedBlockedSlots = workingHoursData.exceptions[dateKey]
        console.log("Loaded blocked slots for", dateKey, ":", savedBlockedSlots)
        // Ensure blocked slots have the correct format
        const formattedSlots = Array.isArray(savedBlockedSlots)
          ? savedBlockedSlots.map((slot: any) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBlocked: true,
            isAvailable: false
          }))
          : []
        setBlockedSlots(formattedSlots)
      } else {
        setBlockedSlots([])
      }
    } catch (error) {
      console.warn("Failed to fetch doctor profile for schedule:", error)
    }
  }

  const fetchSchedule = async () => {
    try {
      const response: any = await apiService.get(`/doctors/schedule?date=${format(selectedDate, "yyyy-MM-dd")}`)
      if (response) {
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

    const toMinutes = (time: string): number | null => {
      if (!time) return null
      const [h, m] = time.split(":").map(Number)
      if (!Number.isFinite(h)) return null
      return h * 60 + (Number.isFinite(m) ? m : 0)
    }
    const breakStartMin = toMinutes(workingHours.breakStart)
    const breakEndMin = toMinutes(workingHours.breakEnd)
    const hasBreak = breakStartMin !== null && breakEndMin !== null && breakStartMin < breakEndMin

    let currentHour = startHour
    let currentMin = startMin

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const currentTotal = currentHour * 60 + currentMin
      const nextTotal = currentTotal + duration

      // Skip any slots that fall inside the break window
      if (hasBreak && currentTotal < (breakEndMin as number) && nextTotal > (breakStartMin as number)) {
        currentHour = Math.floor((breakEndMin as number) / 60)
        currentMin = (breakEndMin as number) % 60
        continue
      }

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
    // Check if slot is already blocked
    const isAlreadyBlocked = blockedSlots.some(
      (b) => b.startTime === slot.startTime && b.endTime === slot.endTime
    )
    if (isAlreadyBlocked) {
      toast.info("This slot is already blocked")
      return
    }
    const newBlockedSlot = {
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBlocked: true,
      isAvailable: false
    }
    setBlockedSlots([...blockedSlots, newBlockedSlot])
    toast.success("Time slot blocked (remember to save)")
  }

  const handleUnblockSlot = (slot: TimeSlot) => {
    // Remove by matching startTime and endTime
    const updated = blockedSlots.filter(
      (b) => !(b.startTime === slot.startTime && b.endTime === slot.endTime)
    )
    setBlockedSlots(updated)
    toast.success("Time slot unblocked (remember to save)")
  }

  const handleSaveSchedule = async () => {
    console.log("=== SAVE SCHEDULE CLICKED ===")
    console.log("Working Hours:", workingHours)
    console.log("Slot Duration:", slotDuration)
    console.log("Blocked Slots:", blockedSlots)
    console.log("Selected Date:", selectedDate)

    try {
      const payload = {
        date: format(selectedDate, "yyyy-MM-dd"),
        workingHours: {
          start: workingHours.start,
          end: workingHours.end,
          breakStart: workingHours.breakStart || "",
          breakEnd: workingHours.breakEnd || "",
        },
        slotDuration,
        blockedSlots: blockedSlots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBlocked: true
        }))
      }

      console.log("Sending payload to /doctors/schedule:", JSON.stringify(payload, null, 2))

      const response = await apiService.post("/doctors/schedule", payload)
      console.log("Schedule save response:", response)

      toast.success("Schedule saved successfully!")

      // Refresh the profile to show updated schedule
      console.log("Refreshing profile after save...")
      await fetchProfile()
      console.log("Profile refreshed, blocked slots now:", blockedSlots)
    } catch (error: any) {
      console.error("=== SAVE SCHEDULE FAILED ===")
      console.error("Error:", error)
      console.error("Error response:", error.response)
      console.error("Error data:", error.response?.data)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to save schedule"
      toast.error(`Failed to save: ${errorMessage}`)
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
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
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
              <Label>Break Start (optional)</Label>
              <Input
                type="time"
                value={workingHours.breakStart}
                onChange={(e) => setWorkingHours({ ...workingHours, breakStart: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Break End (optional)</Label>
              <Input
                type="time"
                value={workingHours.breakEnd}
                onChange={(e) => setWorkingHours({ ...workingHours, breakEnd: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Slot Duration (minutes)</Label>
              <Select value={slotDuration.toString()} onValueChange={(v) => setSlotDuration(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {Array.from({ length: 60 }, (_, i) => i + 1).map((mins) => (
                    <SelectItem key={mins} value={mins.toString()}>
                      {mins} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {workingHours.breakStart && workingHours.breakEnd &&
            (workingHours.breakStart >= workingHours.breakEnd ||
              workingHours.breakStart < workingHours.start ||
              workingHours.breakEnd > workingHours.end) && (
            <p className="text-sm text-red-500">
              Break must be within working hours and start before it ends. Invalid breaks are ignored when generating slots.
            </p>
          )}

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
                    className={`p-3 border rounded-lg flex items-center justify-between ${isBlocked ? "bg-muted" : "bg-background"
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
                        onClick={() => handleUnblockSlot(slot)}
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

