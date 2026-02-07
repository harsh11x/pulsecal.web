"use client"

import { useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAppSelector, useAppDispatch } from "@/app/hooks"
import { setUnreadCount } from "@/app/features/notificationSlice"
import { apiService } from "@/services/api"

export function NotificationBell() {
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount)
  const dispatch = useAppDispatch()

  useEffect(() => {
    apiService
      .get<{ unreadCount?: number }>("/notifications?limit=1")
      .then((res) => {
        const count = res?.unreadCount ?? 0
        dispatch(setUnreadCount(count))
      })
      .catch(() => {})
  }, [dispatch])

  return (
    <Link href="/notifications">
      <Button variant="ghost" size="sm" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  )
}
