"use client"

import type React from "react"

import { useAppSelector } from "@/app/hooks"
import { hasPermission } from "@/utils/permissions"
import type { UserRole } from "@/utils/constants"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"

interface RoleGuardProps {
  children: React.ReactNode
  permission: keyof typeof import("@/utils/permissions").PERMISSIONS
}

export function RoleGuard({ children, permission }: RoleGuardProps) {
  const { user } = useAppSelector((state) => state.auth)

  if (!user || !hasPermission(user.role as UserRole, permission)) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this page. Please contact your administrator if you believe this is an
            error.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <>{children}</>
}
