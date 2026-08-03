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
  Building2,
  Stethoscope,
  Wallet,
  Users,
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
    title: "Find Doctors",
    href: "/appointments/create",
    icon: Stethoscope,
  },
  {
    title: "Health Services",
    href: "/services/insurance",
    icon: Heart,
    permission: "VIEW_INSURANCE",
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
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    permission: "VIEW_ADMIN_DASHBOARD",
  },
  {
    title: "Clinics",
    href: "/admin/clinics",
    icon: Building2,
    permission: "VIEW_ADMIN_DASHBOARD",
  },
  {
    title: "Doctor Payouts",
    href: "/admin/doctors/payouts",
    icon: Wallet,
    permission: "VIEW_ADMIN_DASHBOARD",
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: FileText,
    permission: "VIEW_ADMIN_DASHBOARD",
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart,
    permission: "VIEW_ADMIN_DASHBOARD",
  },
  {
    title: "Staff Management",
    href: "/dashboard/staff",
    icon: Users,
    permission: "MANAGE_CLINIC", // Only for head doctors/admins
  },
  {
    title: "Subscription",
    href: "/subscription",
    icon: CreditCard,
    permission: "MANAGE_SUBSCRIPTION", // Doctors & admins; page/API restrict actual management to clinic creator
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAppSelector((state) => state.auth)

  const filteredNavItems = navItems.filter((item) => {
    // Hide non-admin specific items for ADMIN role (case-insensitive)
    const userRole = user?.role?.toLowerCase();
    if (userRole === 'admin') {
      const adminAllowed = [
        "/admin/dashboard",
        "/admin/clinics",
        "/admin/users",
        "/admin/reports",
        "/admin/analytics",
        "/admin/doctors/payouts",
      ];
      // Admins only see admin panel links — never doctor/clinic-owner tools
      return adminAllowed.includes(item.href);
    }

    // Hide Subscription link for non-owner doctors (joining doctors)
    if ((item.href === "/subscription" || item.href === "/dashboard/staff") && userRole === "doctor" && (user as any)?.canManageSubscription !== true) {
      return false
    }

    if (!item.permission) return true
    // crucial fix: use the lowercase userRole for permission checks
    return userRole && hasPermission(userRole as UserRole, item.permission)
  })

  return (
    <aside className={cn("flex h-full flex-col border-r border-border bg-card", className)}>
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname ? (pathname === item.href || pathname.startsWith(item.href + "/")) : false
            const userRole = user?.role?.toLowerCase()
            const isDoctor = userRole === "doctor"

            let displayTitle = item.title
            if (isDoctor) {
              if (item.href === "/appointments/create") displayTitle = "Create Appointment"
              if (item.title === "Payments") displayTitle = "Revenue Dashboard"
            }

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
                <span>{displayTitle}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
