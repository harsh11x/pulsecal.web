"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"

interface DateRangePickerProps {
    value?: DateRange
    onChange: (range: DateRange | undefined) => void
    className?: string
}

const presets = [
    { label: "Today", getValue: () => ({ from: new Date(), to: new Date() }) },
    {
        label: "Yesterday",
        getValue: () => {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            return { from: yesterday, to: yesterday }
        }
    },
    {
        label: "Last 7 days",
        getValue: () => {
            const from = new Date()
            from.setDate(from.getDate() - 7)
            return { from, to: new Date() }
        }
    },
    {
        label: "Last 30 days",
        getValue: () => {
            const from = new Date()
            from.setDate(from.getDate() - 30)
            return { from, to: new Date() }
        }
    },
    {
        label: "Last 3 months",
        getValue: () => {
            const from = new Date()
            from.setMonth(from.getMonth() - 3)
            return { from, to: new Date() }
        }
    },
    {
        label: "Last 6 months",
        getValue: () => {
            const from = new Date()
            from.setMonth(from.getMonth() - 6)
            return { from, to: new Date() }
        }
    },
    {
        label: "Last year",
        getValue: () => {
            const from = new Date()
            from.setFullYear(from.getFullYear() - 1)
            return { from, to: new Date() }
        }
    },
]

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "justify-start text-left font-normal",
                            !value && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {value?.from ? (
                            value.to ? (
                                <>
                                    {format(value.from, "LLL dd, y")} -{" "}
                                    {format(value.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(value.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                        <div className="border-r p-3 space-y-1">
                            <div className="text-sm font-medium mb-2">Presets</div>
                            {presets.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start font-normal"
                                    onClick={() => {
                                        onChange(preset.getValue())
                                        setIsOpen(false)
                                    }}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={value?.from}
                            selected={value}
                            onSelect={onChange}
                            numberOfMonths={2}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
