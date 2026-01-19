"use client"

import { AppLayout } from "@/components/layout/AppLayout"
import { useAutoLogout } from "@/hooks/useAutoLogout"
import { useAppSelector } from "@/app/hooks"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    useAutoLogout()
    const router = useRouter()
    const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth)

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !user)) {
            window.location.href = "https://pulsecal.com"
        }
    }, [isLoading, isAuthenticated, user, router])

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return <AppLayout>{children}</AppLayout>
}
