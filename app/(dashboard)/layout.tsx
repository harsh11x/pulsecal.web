"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppSelector } from "@/app/hooks"
import { useAutoLogout } from "@/hooks/useAutoLogout"
import { AppLayout } from "@/components/layout/AppLayout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

// Define role-based route access
const ROLE_ROUTES: Record<string, string[]> = {
  patient: [
    "/dashboard",
    "/appointments",
    "/medical-records",
    "/prescriptions",
    "/insurance",
    "/profile",
    "/settings",
    "/chat",
    "/health-analytics",
  ],
  doctor: [
    "/dashboard",
    "/appointments",
    "/patients",
    "/prescriptions",
    "/medical-records",
    "/profile",
    "/settings",
    "/analytics",
    "/staff",
    "/chat",
    "/queue",
    "/subscription",
  ],
  receptionist: [
    "/dashboard",
    "/appointments",
    "/patients",
    "/queue",
    "/profile",
    "/settings",
    "/chat",
  ],
  admin: [
    "/dashboard",
    "/appointments",
    "/patients",
    "/users",
    "/clinics",
    "/analytics",
    "/settings",
    "/profile",
  ],
}

// Routes that are restricted by role (only these roles can access)
const RESTRICTED_ROUTES: Record<string, string[]> = {
  "/staff": ["doctor", "admin"],
  "/queue": ["doctor", "receptionist", "admin"],
  "/subscription": ["doctor", "admin"],
  "/analytics": ["doctor", "admin"],
  "/patients": ["doctor", "receptionist", "admin"],
  "/clinics": ["admin"],
  "/users": ["admin"],
}

function isRouteAllowedForRole(pathname: string, role: string): boolean {
  const normalizedRole = role.toLowerCase()
  
  // Check restricted routes first
  for (const [restrictedPath, allowedRoles] of Object.entries(RESTRICTED_ROUTES)) {
    if (pathname.startsWith(restrictedPath)) {
      return allowedRoles.includes(normalizedRole)
    }
  }
  
  // All users can access common routes like /dashboard, /profile, /settings
  const commonRoutes = ["/dashboard", "/profile", "/settings", "/chat"]
  if (commonRoutes.some(route => pathname.startsWith(route))) {
    return true
  }
  
  // Check if route is in allowed routes for this role
  const allowedRoutes = ROLE_ROUTES[normalizedRole] || []
  return allowedRoutes.some(route => pathname.startsWith(route))
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Auto-logout after 15 minutes of inactivity
  useAutoLogout()

  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    // Only redirect if done loading and not authenticated
    if (!isLoading && (!isAuthenticated || !user)) {
      window.location.href = "https://pulsecal.com"
      return
    }

    // Check role-based access
    if (!isLoading && user && pathname) {
      const userRole = user.role?.toLowerCase() || "patient"
      const isAllowed = isRouteAllowedForRole(pathname, userRole)
      
      if (!isAllowed) {
        setAccessDenied(true)
      } else {
        setAccessDenied(false)
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show access denied message
  if (accessDenied && user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="max-w-md text-center">
            <Alert variant="destructive" className="mb-6">
              <ShieldAlert className="h-5 w-5" />
              <AlertTitle className="text-lg">Access Denied</AlertTitle>
              <AlertDescription className="mt-2">
                You don't have permission to access this page. 
                Your account is registered as a <strong className="capitalize">{user.role}</strong>.
              </AlertDescription>
            </Alert>
            <p className="text-muted-foreground mb-4">
              Each account type has access to specific features. Please use the correct account for the feature you're trying to access.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Go to Your Dashboard
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return <AppLayout>{children}</AppLayout>
}
