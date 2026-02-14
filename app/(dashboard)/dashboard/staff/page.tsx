
"use client"

import StaffManager from "@/components/dashboard/StaffManager"
import { useAppSelector } from "@/app/hooks"
import { Button } from "@/components/ui/button"
import { ShieldX } from "lucide-react"
import Link from "next/link"

export default function StaffManagementPage() {
  const user = useAppSelector((state) => state.auth.user)
  const role = user?.role?.toLowerCase()
  const isOwnerDoctor = role === "doctor" && (user as any)?.canManageSubscription === true
  const isAdmin = role === "admin"

  if (!isOwnerDoctor && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
        <ShieldX className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Access Restricted</h2>
        <p className="text-muted-foreground max-w-md">
          Only the clinic owner (head doctor) or admin can manage clinic staff. Please contact your clinic owner for changes.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <p className="text-muted-foreground">Manage your clinic's team members</p>
      </div>
      <StaffManager />
    </div>
  )
}
