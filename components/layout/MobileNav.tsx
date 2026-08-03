"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  FileText,
  MessageSquare,
  LayoutDashboard,
  User,
  Users,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppSelector } from "@/app/hooks"

const defaultMobileNavItems = [
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
    title: "Records",
    href: "/health/medical-records",
    icon: FileText,
  },
  {
    title: "Chat",
    href: "/chat/rooms",
    icon: MessageSquare,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
]

const adminMobileNavItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Clinics",
    href: "/admin/clinics",
    icon: Building2,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: FileText,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const { user } = useAppSelector((state) => state.auth)
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN"
  const mobileNavItems = isAdmin ? adminMobileNavItems : defaultMobileNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
