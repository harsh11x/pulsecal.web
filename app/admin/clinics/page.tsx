"use client"

import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Building2, Users, Calendar, IndianRupee, ChevronRight } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ClinicWithStats {
    id: string
    name: string
    city: string
    state: string
    phone: string
    email: string
    subscriptionPlan: string
    subscriptionStatus: string
    isActive: boolean
    createdAt: string
    doctorCount: number
    receptionistCount: number
    totalBookings: number
    pastBookings: number
    futureBookings: number
    totalRevenue: number
}

export default function AdminClinicsPage() {
    const [clinics, setClinics] = useState<ClinicWithStats[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    useEffect(() => {
        loadClinics()
    }, [])

    const loadClinics = async () => {
        try {
            setLoading(true)
            const response: any = await apiService.get("/api/v1/admin/clinics", {
                params: {
                    limit: 100,
                    search: searchQuery || undefined,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                },
            })
            setClinics(response?.data?.clinics || response?.clinics || [])
        } catch (error: any) {
            console.error("Failed to load clinics:", error)
            toast.error(error?.response?.data?.message || "Failed to load clinics")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            loadClinics()
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery, statusFilter])

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            ACTIVE: "bg-green-100 text-green-800",
            PENDING: "bg-yellow-100 text-yellow-800",
            EXPIRED: "bg-red-100 text-red-800",
        }
        return colors[status] || "bg-gray-100 text-gray-800"
    }

    const getPlanBadge = (plan: string) => {
        const colors: Record<string, string> = {
            STARTER: "bg-slate-100 text-slate-800",
            BASIC: "bg-blue-100 text-blue-800",
            PROFESSIONAL: "bg-purple-100 text-purple-800",
            ENTERPRISE: "bg-indigo-100 text-indigo-800",
        }
        return colors[plan] || "bg-gray-100 text-gray-800"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Clinic Management</h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage all registered clinics
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">{clinics.length} Clinics</span>
                </div>
            </div>

            <Card className="p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search clinics by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-border rounded-md bg-background"
                    >
                        <option value="all">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING">Pending</option>
                        <option value="EXPIRED">Expired</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-3 px-4">Clinic</th>
                                <th className="text-left py-3 px-4">Location</th>
                                <th className="text-left py-3 px-4">Plan</th>
                                <th className="text-center py-3 px-4">Staff</th>
                                <th className="text-center py-3 px-4">Bookings</th>
                                <th className="text-right py-3 px-4">Revenue</th>
                                <th className="text-center py-3 px-4">Status</th>
                                <th className="text-right py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clinics.map((clinic) => (
                                <tr
                                    key={clinic.id}
                                    className="border-b border-border hover:bg-accent/50 transition-colors"
                                >
                                    <td className="py-4 px-4">
                                        <div className="font-medium">{clinic.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {clinic.email || clinic.phone}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div>{clinic.city}</div>
                                        <div className="text-sm text-muted-foreground">{clinic.state}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadge(clinic.subscriptionPlan)}`}>
                                            {clinic.subscriptionPlan}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="flex items-center gap-1" title="Doctors">
                                                <Users className="h-4 w-4 text-blue-500" />
                                                <span>{clinic.doctorCount}</span>
                                            </div>
                                            <div className="flex items-center gap-1" title="Receptionists">
                                                <Users className="h-4 w-4 text-green-500" />
                                                <span>{clinic.receptionistCount}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{clinic.totalBookings}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {clinic.futureBookings} upcoming
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1 font-medium">
                                            <IndianRupee className="h-4 w-4" />
                                            {clinic.totalRevenue.toLocaleString("en-IN")}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(clinic.subscriptionStatus)}`}>
                                            {clinic.subscriptionStatus}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <Link href={`/admin/clinics/${clinic.id}`}>
                                            <Button variant="ghost" size="sm">
                                                View <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {clinics.length === 0 && (
                        <div className="text-center py-12">
                            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No clinics found</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
