
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, User as UserIcon, Mail, Phone } from "lucide-react"
import { userService } from "@/services/user.service"
import { User } from "@/types"
import { Badge } from "@/components/ui/badge"

export default function PatientsDirectoryPage() {
    const [patients, setPatients] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                setLoading(true)
                const data = await userService.getAllUsers("patient")
                setPatients(data)
            } catch (error) {
                console.error("Failed to load patients:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchPatients()
    }, [])

    const filteredPatients = patients.filter(patient =>
        patient.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Patient Directory</h1>
                    <p className="text-muted-foreground">Manage and view patient records</p>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search patients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registered Patients</CardTitle>
                    <CardDescription>Total: {filteredPatients.length} patients</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">Loading patients...</TableCell>
                                </TableRow>
                            ) : filteredPatients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No patients found</TableCell>
                                </TableRow>
                            ) : (
                                filteredPatients.map((patient) => (
                                    <TableRow key={patient.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    {patient.profileImage ? (
                                                        <img src={patient.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <UserIcon className="h-4 w-4 text-primary" />
                                                    )}
                                                </div>
                                                {patient.firstName} {patient.lastName}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Mail className="h-3 w-3" />
                                                {patient.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {patient.phone ? (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Phone className="h-3 w-3" />
                                                    {patient.phone}
                                                </div>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={patient.isActive ? "default" : "secondary"}>
                                                {patient.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="cursor-pointer hover:bg-slate-100">Details</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
