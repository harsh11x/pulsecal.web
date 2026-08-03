"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Building2,
    MapPin,
    Phone,
    Mail,
    Users,
    Calendar,
    IndianRupee,
    Clock,
    Activity,
    CreditCard,
    ArrowLeft,
    Loader2,
    UserCheck,
    Ban,
    CheckCircle2,
    Trash2,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/utils/helpers"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { adminService } from "@/services/admin.service"

export default function ClinicDetailsPage() {
    const { id } = useParams()
    const router = useRouter()
    const [clinic, setClinic] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        if (id) {
            fetchClinicDetails()
        }
    }, [id])

    const fetchClinicDetails = async () => {
        try {
            setLoading(true)
            const data = await adminService.getClinic(String(id))
            setClinic(data)
        } catch (error) {
            console.error("Failed to fetch clinic details:", error)
            toast.error("Failed to load clinic details")
        } finally {
            setLoading(false)
        }
    }

    const handleSuspendToggle = async () => {
        if (!clinic) return
        const next = !clinic.isActive
        const msg = next
            ? `Activate "${clinic.name}"?`
            : `Suspend "${clinic.name}"? Booking for this clinic will be blocked while suspended.`
        if (!confirm(msg)) return
        try {
            setActionLoading(true)
            if (next) await adminService.activateClinic(clinic.id)
            else await adminService.suspendClinic(clinic.id)
            toast.success(next ? "Clinic activated" : "Clinic suspended")
            await fetchClinicDetails()
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update clinic status")
        } finally {
            setActionLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!clinic) return
        if (!confirm(`Delete "${clinic.name}"? This soft-deletes the clinic from the platform.`)) return
        try {
            setActionLoading(true)
            await adminService.deleteClinic(clinic.id)
            toast.success("Clinic deleted")
            router.push("/admin/clinics")
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to delete clinic")
            setActionLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading clinic details...</p>
            </div>
        )
    }

    if (!clinic) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h2 className="text-2xl font-bold">Clinic not found</h2>
                <Button onClick={() => router.push("/admin/clinics")}>Back to Clinics</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/admin/clinics")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{clinic.name}</h1>
                            <Badge variant={clinic.isActive ? "default" : "secondary"}>
                                {clinic.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{clinic.subscriptionPlan}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-muted-foreground text-sm">
                            <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {clinic.address}, {clinic.city}, {clinic.state}
                            </span>
                            <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {clinic.phone}
                            </span>
                            <span className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {clinic.email || "No email provided"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        disabled={actionLoading}
                        onClick={handleSuspendToggle}
                    >
                        {clinic.isActive ? (
                            <>
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend Clinic
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Activate Clinic
                            </>
                        )}
                    </Button>
                    <Button variant="destructive" disabled={actionLoading} onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Clinic
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(clinic.stats.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clinic.stats.totalPastAppointments + clinic.stats.totalFutureAppointments}</div>
                        <p className="text-xs text-muted-foreground">
                            {clinic.stats.totalFutureAppointments} upcoming
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doctors</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clinic.stats.totalDoctors}</div>
                        <p className="text-xs text-muted-foreground">Active specialists</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receptionists</CardTitle>
                        <UserCheck className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clinic.stats.totalReceptionists}</div>
                        <p className="text-xs text-muted-foreground">Support staff</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="staff">Staff Members</TabsTrigger>
                    <TabsTrigger value="appointments">Appointments</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                {/* Placeholder for chart or activity feed using real data if available in future */}
                                <div className="space-y-4">
                                    {clinic.recentPayments.slice(0, 3).map((payment: any) => (
                                        <div key={payment.id} className="flex items-center">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                                                <IndianRupee className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none">Payment Received</p>
                                                <p className="text-xs text-muted-foreground">{payment.description || "Consultation Fee"}</p>
                                            </div>
                                            <div className="ml-auto font-medium">{formatCurrency(payment.amount)}</div>
                                        </div>
                                    ))}
                                    {clinic.futureAppointments.slice(0, 3).map((apt: any) => (
                                        <div key={apt.id} className="flex items-center">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                                                <Calendar className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none">Appointment Scheduled</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {apt.patient?.firstName} with Dr. {apt.doctor?.firstName}
                                                </p>
                                            </div>
                                            <div className="ml-auto font-medium text-muted-foreground text-sm">
                                                {new Date(apt.scheduledAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                    {clinic.recentPayments.length === 0 && clinic.futureAppointments.length === 0 && (
                                        <p className="text-muted-foreground text-sm">No recent activity found.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Clinic Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Founded</span>
                                        <span className="font-medium">{new Date(clinic.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Max Doctors</span>
                                        <span className="font-medium">{clinic.maxDoctors}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-muted-foreground">Subscription</span>
                                        <Badge variant="outline" className="capitalize">{clinic.subscriptionStatus}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Country</span>
                                        <span className="font-medium">{clinic.country}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* STAFF TAB */}
                <TabsContent value="staff" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Doctors</CardTitle>
                            <CardDescription>Medical professionals associated with this clinic</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Doctor</TableHead>
                                        <TableHead>Specialization</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Fee</TableHead>
                                        <TableHead>Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clinic.doctors.map((doc: any) => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={doc.profileImage} />
                                                        <AvatarFallback>{doc.firstName?.[0]}{doc.lastName?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span>Dr. {doc.firstName} {doc.lastName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{doc.doctorProfile?.specialization || "General"}</TableCell>
                                            <TableCell>{doc.email}</TableCell>
                                            <TableCell>{formatCurrency(doc.doctorProfile?.consultationFee || 0)}</TableCell>
                                            <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {clinic.doctors.length === 0 && (
                                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No doctors found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Receptionists</CardTitle>
                            <CardDescription>Data entry and support staff</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clinic.receptionists.map((rec: any) => (
                                        <TableRow key={rec.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={rec.profileImage} />
                                                        <AvatarFallback>{rec.firstName?.[0]}{rec.lastName?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{rec.firstName} {rec.lastName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{rec.email}</TableCell>
                                            <TableCell>{rec.phone || "N/A"}</TableCell>
                                            <TableCell>{new Date(rec.createdAt).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {clinic.receptionists.length === 0 && (
                                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No receptionists found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* APPOINTMENTS TAB */}
                <TabsContent value="appointments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Appointments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Doctor</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clinic.futureAppointments.map((apt: any) => (
                                        <TableRow key={apt.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{new Date(apt.scheduledAt).toLocaleDateString()}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{apt.patient?.firstName} {apt.patient?.lastName}</TableCell>
                                            <TableCell>Dr. {apt.doctor?.firstName}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{apt.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {clinic.futureAppointments.length === 0 && (
                                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No upcoming appointments.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Past Appointments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Doctor</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clinic.pastAppointments.map((apt: any) => (
                                        <TableRow key={apt.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{new Date(apt.scheduledAt).toLocaleDateString()}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{apt.patient?.firstName} {apt.patient?.lastName}</TableCell>
                                            <TableCell>Dr. {apt.doctor?.firstName}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{apt.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {clinic.pastAppointments.length === 0 && (
                                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No past history.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* FINANCIALS TAB */}
                <TabsContent value="financials" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Payments</CardTitle>
                            <CardDescription>Transaction history for this clinic</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clinic.recentPayments.map((payment: any) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>{payment.description}</TableCell>
                                            <TableCell className="capitalize">{payment.method?.replace('_', ' ')}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {clinic.recentPayments.length === 0 && (
                                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No payment records found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function UserCheckIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <polyline points="16 11 18 13 22 9" />
        </svg>
    )
}
