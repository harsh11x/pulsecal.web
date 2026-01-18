"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { apiService } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ArrowLeft,
    Building2,
    Users,
    Calendar,
    IndianRupee,
    Mail,
    Phone,
    MapPin,
    User,
    Stethoscope,
    Clock,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface StaffMember {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    role: string
    profileImage?: string
    createdAt: string
    doctorProfile?: {
        specialization: string
        consultationFee: number
        subscriptionStatus: string
    }
}

interface Appointment {
    id: string
    scheduledAt: string
    status: string
    reason?: string
    duration: number
    patient: {
        id: string
        firstName: string
        lastName: string
        email: string
    }
    doctor: {
        id: string
        firstName: string
        lastName: string
    }
}

interface Payment {
    id: string
    amount: number
    currency: string
    method?: string
    description?: string
    createdAt: string
}

interface ClinicDetails {
    id: string
    name: string
    address: string
    city: string
    state: string
    zipCode: string
    phone: string
    email?: string
    subscriptionPlan: string
    subscriptionStatus: string
    isActive: boolean
    createdAt: string
    doctors: StaffMember[]
    receptionists: StaffMember[]
    stats: {
        totalDoctors: number
        totalReceptionists: number
        totalPastAppointments: number
        totalFutureAppointments: number
        totalRevenue: number
    }
    pastAppointments: Appointment[]
    futureAppointments: Appointment[]
    recentPayments: Payment[]
}

export default function ClinicDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [clinic, setClinic] = useState<ClinicDetails | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (params.id) {
            loadClinic(params.id as string)
        }
    }, [params.id])

    const loadClinic = async (id: string) => {
        try {
            setLoading(true)
            const response: any = await apiService.get(`/api/v1/admin/clinics/${id}`)
            setClinic(response?.data || response)
        } catch (error: any) {
            console.error("Failed to load clinic details:", error)
            toast.error(error?.response?.data?.message || "Failed to load clinic details")
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            ACTIVE: "bg-green-100 text-green-800",
            PENDING: "bg-yellow-100 text-yellow-800",
            EXPIRED: "bg-red-100 text-red-800",
            SCHEDULED: "bg-blue-100 text-blue-800",
            CONFIRMED: "bg-green-100 text-green-800",
            COMPLETED: "bg-gray-100 text-gray-800",
            CANCELLED: "bg-red-100 text-red-800",
        }
        return colors[status] || "bg-gray-100 text-gray-800"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!clinic) {
        return (
            <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Clinic not found</p>
                <Button onClick={() => router.back()} className="mt-4">
                    Go Back
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">{clinic.name}</h1>
                    <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {clinic.city}, {clinic.state}
                        </span>
                        {clinic.phone && (
                            <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {clinic.phone}
                            </span>
                        )}
                        {clinic.email && (
                            <span className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {clinic.email}
                            </span>
                        )}
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(clinic.subscriptionStatus)}`}>
                    {clinic.subscriptionStatus}
                </span>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Doctors</CardTitle>
                        <Stethoscope className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clinic.stats.totalDoctors}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Receptionists</CardTitle>
                        <Users className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clinic.stats.totalReceptionists}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <Calendar className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {clinic.stats.totalPastAppointments + clinic.stats.totalFutureAppointments}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {clinic.stats.totalFutureAppointments} upcoming
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{clinic.stats.totalRevenue.toLocaleString("en-IN")}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="staff" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="staff">Staff</TabsTrigger>
                    <TabsTrigger value="appointments">Appointments</TabsTrigger>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                </TabsList>

                {/* Staff Tab */}
                <TabsContent value="staff">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Doctors */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Stethoscope className="h-5 w-5 text-blue-500" />
                                    Doctors ({clinic.doctors.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {clinic.doctors.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">No doctors registered</p>
                                    ) : (
                                        clinic.doctors.map((doctor) => (
                                            <div key={doctor.id} className="flex items-center gap-4 p-3 bg-accent/50 rounded-lg">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium">
                                                        Dr. {doctor.firstName} {doctor.lastName}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {doctor.doctorProfile?.specialization || "General"}
                                                    </div>
                                                </div>
                                                {doctor.doctorProfile?.consultationFee && (
                                                    <div className="text-sm font-medium text-green-600">
                                                        ₹{Number(doctor.doctorProfile.consultationFee).toLocaleString("en-IN")}/visit
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Receptionists */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-green-500" />
                                    Receptionists ({clinic.receptionists.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {clinic.receptionists.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">No receptionists registered</p>
                                    ) : (
                                        clinic.receptionists.map((receptionist) => (
                                            <div key={receptionist.id} className="flex items-center gap-4 p-3 bg-accent/50 rounded-lg">
                                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium">
                                                        {receptionist.firstName} {receptionist.lastName}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">{receptionist.email}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Appointments Tab */}
                <TabsContent value="appointments">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Upcoming Appointments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-blue-500" />
                                    Upcoming Appointments ({clinic.futureAppointments.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {clinic.futureAppointments.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">No upcoming appointments</p>
                                    ) : (
                                        clinic.futureAppointments.map((apt) => (
                                            <div key={apt.id} className="p-3 border rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium">
                                                        {apt.patient.firstName} {apt.patient.lastName}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(apt.status)}`}>
                                                        {apt.status}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    with Dr. {apt.doctor.firstName} {apt.doctor.lastName}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm mt-2">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(apt.scheduledAt), "PPp")}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Past Appointments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-gray-500" />
                                    Past Appointments ({clinic.pastAppointments.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {clinic.pastAppointments.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">No past appointments</p>
                                    ) : (
                                        clinic.pastAppointments.map((apt) => (
                                            <div key={apt.id} className="p-3 border rounded-lg opacity-75">
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium">
                                                        {apt.patient.firstName} {apt.patient.lastName}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(apt.status)}`}>
                                                        {apt.status}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    with Dr. {apt.doctor.firstName} {apt.doctor.lastName}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm mt-2">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(apt.scheduledAt), "PPp")}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Revenue Tab */}
                <TabsContent value="revenue">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <IndianRupee className="h-5 w-5 text-orange-500" />
                                Recent Payments ({clinic.recentPayments.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4">Date</th>
                                            <th className="text-left py-3 px-4">Description</th>
                                            <th className="text-left py-3 px-4">Method</th>
                                            <th className="text-right py-3 px-4">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clinic.recentPayments.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    No payments recorded
                                                </td>
                                            </tr>
                                        ) : (
                                            clinic.recentPayments.map((payment) => (
                                                <tr key={payment.id} className="border-b hover:bg-accent/50">
                                                    <td className="py-3 px-4">
                                                        {format(new Date(payment.createdAt), "PP")}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {payment.description || "Consultation"}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-1 bg-accent rounded text-xs">
                                                            {payment.method || "Online"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-medium">
                                                        ₹{Number(payment.amount).toLocaleString("en-IN")}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
