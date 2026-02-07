"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Check, Trash2, Calendar, FileText, MessageSquare, Loader2, CreditCard, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { apiService } from "@/services/api"
import { SOCKET_EVENTS } from "@/utils/constants"
import { socketService } from "@/services/socket"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { incrementUnreadCount, setUnreadCount } from "@/app/features/notificationSlice"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  timestamp: Date
  read: boolean
}

interface ExtendedNotification extends Notification {
  rawType?: string
  appointmentId?: string
}

const mapApiNotification = (n: any): ExtendedNotification => {
  const appointmentTypes = ["NEW_APPOINTMENT", "UPCOMING_APPOINTMENT", "COMPLETED_VISIT", "CANCELLATION", "APPOINTMENT_REMINDER", "RESCHEDULED"];
  const paymentTypes = ["PAYMENT_RECEIVED", "PAYMENT_SENT"];
  const subscriptionTypes = ["SUBSCRIPTION_EXPIRING", "SUBSCRIPTION_EXPIRED"];
  let type = "message";
  if (appointmentTypes.includes(n.type)) type = "appointment";
  else if (paymentTypes.includes(n.type)) type = "record";
  else if (subscriptionTypes.includes(n.type)) type = "message";
  const meta = n.metadata as Record<string, unknown> | undefined
  return {
    id: n.id,
    type,
    rawType: n.type,
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdAt),
    read: !!n.isRead,
    appointmentId: meta?.appointmentId as string | undefined,
  };
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user } = useAppSelector((state) => state.auth)
  const [notifications, setNotifications] = useState<ExtendedNotification[]>([])
  const [filter, setFilter] = useState<"all" | "appointments" | "payments">("all")
  const [loading, setLoading] = useState(true)
  const dispatch = useAppDispatch()
  const role = (user?.role as string)?.toLowerCase() || "patient"

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiService.get<any>("/notifications?limit=100")
      const list = Array.isArray(res?.notifications) ? res.notifications : Array.isArray(res) ? res : []
      const mapped = list.map(mapApiNotification)
      setNotifications(mapped)
      const unread = res?.unreadCount ?? mapped.filter((n) => !n.read).length
      dispatch(setUnreadCount(unread))
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Real-time: connect and listen for new notifications
  useEffect(() => {
    socketService.connect()
    const handleNew = (payload: any) => {
      const n = payload?.data ?? payload
      if (n?.title && n?.message) {
        setNotifications((prev) => [
          {
            id: `socket-${Date.now()}`,
            type: "appointment",
            rawType: "NEW_APPOINTMENT",
            title: n.title,
            message: n.message,
            timestamp: new Date(),
            read: false,
            appointmentId: n.appointmentId ?? payload?.data?.appointmentId,
          },
          ...prev,
        ])
        dispatch(incrementUnreadCount())
      }
    }
    const handleGeneric = (payload: any) => {
      if (payload?.title && payload?.message) {
        const aptTypes = ["NEW_APPOINTMENT", "CANCELLATION", "COMPLETED_VISIT", "RESCHEDULED", "APPOINTMENT_REMINDER", "UPCOMING_APPOINTMENT"]
        setNotifications((prev) => [
          {
            id: `socket-${Date.now()}`,
            type: aptTypes.includes(payload.type) ? "appointment" : "message",
            rawType: payload.type,
            title: payload.title,
            message: payload.message,
            timestamp: new Date(),
            read: false,
            appointmentId: payload.data?.appointmentId,
          },
          ...prev,
        ])
        dispatch(incrementUnreadCount())
      }
    }
    socketService.on(SOCKET_EVENTS.APPOINTMENT_NEW, handleNew)
    socketService.on(SOCKET_EVENTS.NOTIFICATION, handleGeneric)
    return () => {
      socketService.off(SOCKET_EVENTS.APPOINTMENT_NEW, handleNew)
      socketService.off(SOCKET_EVENTS.NOTIFICATION, handleGeneric)
    }
  }, [dispatch])

  const markAsRead = async (id: string) => {
    if (id.startsWith("socket-")) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      return
    }
    try {
      await apiService.put(`/notifications/${id}/read`, {})
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    // API doesn't support delete; local only for socket-sourced items
  }

  const markAllAsRead = async () => {
    try {
      await apiService.put("/notifications/read-all", {})
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  const getIcon = (n: ExtendedNotification) => {
    const t = n.rawType || n.type
    if (t === "CANCELLATION") return AlertCircle
    if (t === "COMPLETED_VISIT") return Check
    if (t === "PAYMENT_RECEIVED" || t === "PAYMENT_SENT") return CreditCard
    if (t === "SUBSCRIPTION_EXPIRING" || t === "SUBSCRIPTION_EXPIRED") return Bell
    if (n.type === "appointment") return Calendar
    if (n.type === "record") return FileText
    return MessageSquare
  }

  const filteredNotifications =
    filter === "all"
      ? notifications
      : filter === "appointments"
        ? notifications.filter((n) => n.type === "appointment")
        : notifications.filter((n) => n.type === "record")

  const handleNotificationClick = (n: ExtendedNotification) => {
    if (n.appointmentId) router.push(`/appointments/${n.appointmentId}`)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const roleLabels = {
    doctor: { title: "Doctor Notifications", empty: "No notifications yet. You'll see new appointments, cancellations, completed visits, and payment alerts here." },
    patient: { title: "Your Notifications", empty: "No notifications yet. You'll see appointment confirmations, reminders, cancellations, and visit updates here." },
    receptionist: { title: "Clinic Notifications", empty: "No notifications yet. You'll see new bookings, cancellations, and completed visits for your clinic here." },
  }
  const labels = roleLabels[role as keyof typeof roleLabels] || roleLabels.patient

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{labels.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <Check className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        )}
      </div>

      {(role === "doctor" || role === "patient" || role === "receptionist") && notifications.length > 0 && (
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "appointments" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("appointments")}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Appointments
          </Button>
          {role === "doctor" && (
            <Button
              variant={filter === "payments" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("payments")}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Payments
            </Button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{filter === "all" ? labels.empty : `No ${filter} notifications`}</p>
            </div>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = getIcon(notification)
            return (
              <Card
                key={notification.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-accent/30 ${!notification.read ? "bg-primary/5 border-primary/20" : ""}`}
                onClick={() => notification.appointmentId && handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg shrink-0 ${!notification.read ? "bg-primary" : "bg-accent"}`}>
                    <Icon className={`h-5 w-5 ${!notification.read ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(notification.timestamp, "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {!notification.read && (
                          <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
