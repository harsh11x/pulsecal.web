"use client"

import { AppLayout } from "@/components/layout/AppLayout"
import { useAutoLogout } from "@/hooks/useAutoLogout"
import { useAppSelector } from "@/app/hooks"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    useAutoLogout()
    const router = useRouter()
    const pathname = usePathname()
    const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth)
    const isLoginPage = pathname === "/admin/login"

    useEffect(() => {
        // Skip check if on login page
        if (isLoginPage) return

        if (!isLoading && (!isAuthenticated || !user)) {
            router.push("/admin/login")
        } else if (!isLoading && user?.role !== "ADMIN" && pathname?.startsWith("/admin")) {
            // Non-admin trying to access admin - redirect to their dashboard
            router.push("/dashboard")
        }
    }, [isLoading, isAuthenticated, user, router, pathname, isLoginPage])

    // Login must always render — never block behind auth loading spinner
    if (isLoginPage) {
        return <>{children}</>
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return <AppLayout>{children}</AppLayout>
}
