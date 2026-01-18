"use client"

import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    Users,
    Building2,
    Calendar,
    FileText,
    Pill,
    TrendingUp,
    Stethoscope,
    UserCheck,
    ChevronRight,
} from "lucide-react"
import { toast } from "sonner"

interface SystemStats {
    totalUsers: number
    totalPatients: number
    totalDoctors: number
    totalClinics: number
    totalAppointments: number
    activeAppointments: number
    totalMedicalRecords: number
    totalPrescriptions: number
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<SystemStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const response: any = await apiService.get("/api/v1/admin/stats")
            setStats(response?.data || response)
        } catch (error: any) {
            console.error("Failed to load stats:", error)
            toast.error("Failed to load dashboard stats")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    const statCards = [
        { title: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500" },
        { title: "Patients", value: stats?.totalPatients || 0, icon: UserCheck, color: "text-green-500" },
        { title: "Doctors", value: stats?.totalDoctors || 0, icon: Stethoscope, color: "text-purple-500" },
        { title: "Clinics", value: stats?.totalClinics || 0, icon: Building2, color: "text-orange-500" },
        { title: "Total Appointments", value: stats?.totalAppointments || 0, icon: Calendar, color: "text-indigo-500" },
        { title: "Active Appointments", value: stats?.activeAppointments || 0, icon: TrendingUp, color: "text-pink-500" },
        { title: "Medical Records", value: stats?.totalMedicalRecords || 0, icon: FileText, color: "text-teal-500" },
        { title: "Prescriptions", value: stats?.totalPrescriptions || 0, icon: Pill, color: "text-amber-500" },
    ]

    const quickLinks = [
        { title: "Manage Clinics", description: "View all registered clinics, doctors, receptionists, and revenue", href: "/admin/clinics", icon: Building2 },
        { title: "Manage Users", description: "View and manage all users in the system", href: "/admin/users", icon: Users },
        { title: "View Analytics", description: "System-wide analytics and reports", href: "/admin/analytics", icon: TrendingUp },
        { title: "Reports", description: "Generate and download reports", href: "/admin/reports", icon: FileText },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    System overview and management
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Quick Links */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {quickLinks.map((link) => {
                        const Icon = link.icon
                        return (
                            <Link key={link.href} href={link.href}>
                                <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                                    <CardContent className="p-6 flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <Icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{link.title}</h3>
                                            <p className="text-sm text-muted-foreground">{link.description}</p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
