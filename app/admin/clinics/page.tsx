"use client"

import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Search,
    Filter,
    MoreHorizontal,
    MapPin,
    Users,
    IndianRupee,
    Building2,
    Calendar,
    Loader2
} from "lucide-react"
import { formatCurrency } from "@/utils/helpers"
import { toast } from "sonner"

interface Clinic {
    id: string
    name: string
    city: string
    state: string
    doctorCount: number
    receptionistCount: number
    totalBookings: number
    totalRevenue: number
    isActive: boolean
    subscriptionStatus: string
    createdAt: string
}

export default function ClinicsListPage() {
    const [clinics, setClinics] = useState<Clinic[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [stats, setStats] = useState({
        totalClinics: 0,
        totalRevenue: 0,
        totalDoctors: 0
    })

    const router = useRouter()

    useEffect(() => {
        fetchClinics()
    }, [])

    const fetchClinics = async () => {
        try {
            setLoading(true)
            const response: any = await apiService.get("/api/v1/admin/clinics")
            // Handle both paginated and regular response structures
            // apiService returns response.data directly
            // If backend returns { data: [...], pagination: ... }, then response.data is the array
            const clinicsData = Array.isArray(response.data) ? response.data : (response.clinics || [])
            setClinics(clinicsData)

            // Calculate aggregations for the summary cards
            const totalRev = clinicsData.reduce((sum: number, c: Clinic) => sum + (c.totalRevenue || 0), 0)
            const totalDocs = clinicsData.reduce((sum: number, c: Clinic) => sum + (c.doctorCount || 0), 0)

            setStats({
                totalClinics: clinicsData.length,
                totalRevenue: totalRev,
                totalDoctors: totalDocs
            })

        } catch (error) {
            console.error("Failed to fetch clinics:", error)
            toast.error("Failed to load clinics data")
        } finally {
            setLoading(false)
        }
    }

    const filteredClinics = clinics.filter(clinic => {
        const matchesSearch = clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clinic.city.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" && clinic.isActive) ||
            (statusFilter === "INACTIVE" && !clinic.isActive)

        return matchesSearch && matchesStatus
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Clinic Management</h1>
                <p className="text-muted-foreground">
                    Monitor and manage all clinics registered on the platform.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalClinics}</div>
                        <p className="text-xs text-muted-foreground">Registered on platform</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Lifetime platform revenue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDoctors}</div>
                        <p className="text-xs text-muted-foreground">Across all clinics</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search clinics by name or city..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={fetchClinics} variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Refresh Data
                </Button>
            </div>

            {/* Clinics Table */}
            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Clinic Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Staff</TableHead>
                            <TableHead>Bookings</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span>Loading clinics...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredClinics.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No clinics found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClinics.map((clinic) => (
                                <TableRow
                                    key={clinic.id}
                                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                                    onClick={() => router.push(`/admin/clinics/${clinic.id}`)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="text-base">{clinic.name}</span>
                                            <span className="text-xs text-muted-foreground">ID: {clinic.id.substring(0, 8)}...</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            <span>{clinic.city}, {clinic.state}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {clinic.doctorCount} Doctors
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {clinic.receptionistCount} Receptionists
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{clinic.totalBookings}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-green-600">
                                            {formatCurrency(clinic.totalRevenue)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={clinic.isActive ? "default" : "secondary"}>
                                            {clinic.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
