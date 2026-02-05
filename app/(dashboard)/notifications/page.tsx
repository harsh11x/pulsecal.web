"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Check, Trash2, Calendar, FileText, MessageSquare, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { apiService } from "@/services/api"
import { SOCKET_EVENTS } from "@/utils/constants"
import { socketService } from "@/services/socket"
import { useAppDispatch } from "@/app/hooks"
import { incrementUnreadCount } from "@/app/features/notificationSlice"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  timestamp: Date
  read: boolean
}

const mapApiNotification = (n: any): Notification => ({
  id: n.id,
  type: ["NEW_APPOINTMENT", "UPCOMING_APPOINTMENT", "COMPLETED_VISIT", "CANCELLATION", "APPOINTMENT_REMINDER"].includes(n.type) ? "appointment" : n.type === "PAYMENT_RECEIVED" ? "record" : "message",
  title: n.title,
  message: n.message,
  timestamp: new Date(n.createdAt),
  read: !!n.isRead,
})

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const dispatch = useAppDispatch()

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiService.get<any>("/notifications?limit=100")
      const list = Array.isArray(res?.notifications) ? res.notifications : []
      setNotifications(list.map(mapApiNotification))
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

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
            title: n.title,
            message: n.message,
            timestamp: new Date(),
            read: false,
          },
          ...prev,
        ])
        dispatch(incrementUnreadCount())
      }
    }
    const handleGeneric = (payload: any) => {
      if (payload?.title && payload?.message) {
        setNotifications((prev) => [
          {
            id: `socket-${Date.now()}`,
            type: payload.type === "NEW_APPOINTMENT" ? "appointment" : "message",
            title: payload.title,
            message: payload.message,
            timestamp: new Date(),
            read: false,
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

  const getIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return Calendar
      case "record":
        return FileText
      case "message":
        return MessageSquare
      default:
        return Bell
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <Check className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications</p>
            </div>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = getIcon(notification.type)
            return (
              <Card
                key={notification.id}
                className={`p-4 ${!notification.read ? "bg-primary/5 border-primary/20" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${!notification.read ? "bg-primary" : "bg-accent"}`}>
                    <Icon className={`h-5 w-5 ${!notification.read ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(notification.timestamp, "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                          <Trash2 className="h-4 w-4 text-error" />
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
