import { format, formatDistance, parseISO } from "date-fns"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: string | Date, formatStr = "PPP"): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return format(dateObj, formatStr)
}

export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return formatDistance(dateObj, new Date(), { addSuffix: true })
}

export const getInitials = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') {
    return "U"
  }
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    scheduled: "text-primary bg-primary/10",
    confirmed: "text-success bg-success/10",
    in_progress: "text-warning bg-warning/10",
    completed: "text-success bg-success/10",
    cancelled: "text-destructive bg-destructive/10",
    no_show: "text-muted-foreground bg-muted",
  }
  return colors[status] || "text-muted-foreground bg-muted"
}
