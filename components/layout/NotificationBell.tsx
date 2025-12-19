"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function NotificationBell() {
  const [unreadCount] = useState(2)

  return (
    <Link href="/notifications">
      <Button variant="ghost" size="sm" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-error text-white text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>
    </Link>
  )
}
