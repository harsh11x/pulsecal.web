"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface AdminDashboardPageProps {
  user: any
}

export default function AdminDashboardPage({ user }: AdminDashboardPageProps) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the dedicated Admin Panel which has real data
    router.replace("/admin/dashboard")
  }, [router])

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Redirecting to Admin Dashboard...</p>
    </div>
  )
}
