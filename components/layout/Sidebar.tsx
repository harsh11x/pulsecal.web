"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  FileText,
  Pill,
  CreditCard,
  MessageSquare,
  Clock,
  LayoutDashboard,
  Heart,
  BarChart,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppSelector } from "@/app/hooks"
import { hasPermission } from "@/utils/permissions"
import type { UserRole } from "@/utils/constants"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  permission?: keyof typeof import("@/utils/permissions").PERMISSIONS
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Appointments",
    href: "/appointments/calendar",
    icon: Calendar,
  },
  {
    title: "Medical Records",
    href: "/health/medical-records",
    icon: FileText,
  },
  {
    title: "Prescriptions",
    href: "/health/prescriptions",
    icon: Pill,
  },
  {
    title: "Health Services",
    href: "/services/insurance",
    icon: Heart,
  },
  {
    title: "Payments",
    href: "/services/payments",
    icon: CreditCard,
  },
  {
    title: "Chat",
    href: "/chat/rooms",
    icon: MessageSquare,
  },
  {
    title: "Queue Status",
    href: "/queue/status",
    icon: Clock,
    permission: "VIEW_QUEUE",
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart,
    permission: "VIEW_ANALYTICS",
  },
  {
    title: "Admin Panel",
    href: "/admin/dashboard",
    icon: Shield,
    permission: "VIEW_ADMIN_DASHBOARD",
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAppSelector((state) => state.auth)

  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true
    return user?.role && hasPermission(user.role as UserRole, item.permission)
  })

  return (
    <aside className={cn("flex h-full flex-col border-r border-border bg-card", className)}>
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
