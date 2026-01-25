"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, Trash2, Mail, Phone, User as UserIcon } from "lucide-react"
import { useAppSelector } from "@/app/hooks"
import { userService } from "@/services/user.service"
import { toast } from "sonner"
import type { User } from "@/types"
import { Badge } from "@/components/ui/badge"

export default function StaffManager() {
    const currentUser = useAppSelector((state: any) => state.auth.user)
    const [staff, setStaff] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newStaff, setNewStaff] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "", // Temporary password
        role: "receptionist",
        clinicId: currentUser?.clinicId || ""
    })
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        if (currentUser?.clinicId) {
            fetchStaff()
        } else {
            setLoading(false)
        }
    }, [currentUser])

    const fetchStaff = async () => {
        try {
            setLoading(true)
            // Fetch both receptionists and doctors in parallel
            const [receptionists, doctors] = await Promise.all([
                userService.getAllUsers("receptionist"),
                userService.getAllUsers("doctor")
            ])

            // Filter by clinicId and combine
            const myReceptionists = receptionists.filter((u: User) => u.clinicId === currentUser.clinicId)
            const myDoctors = doctors.filter((u: User) => u.clinicId === currentUser.clinicId && u.id !== currentUser.id) // Exclude self

            setStaff([...myReceptionists, ...myDoctors])
        } catch (error: any) {
            console.error("Failed to fetch staff:", error)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to load staff members"
            toast.error(errorMessage)
            setStaff([])
        } finally {
            setLoading(false)
        }
    }

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault()
        setActionLoading(true)
        try {
            const payload = {
                ...newStaff,
                clinicId: currentUser.clinicId,
                role: newStaff.role.toUpperCase() as "RECEPTIONIST" | "DOCTOR", // Ensure uppercase for backend enum
                isActive: true,
                isEmailVerified: true // Auto-verify for simplicity
            }

            console.log("Creating staff member with payload:", payload)
            const response: any = await userService.createUser(payload)
            console.log("Create staff response:", response)
            
            const createdUser = response
            
            toast.success(`${newStaff.role === 'doctor' ? 'Doctor' : 'Receptionist'} added successfully`)
            setIsAddDialogOpen(false)
            setNewStaff({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                password: "",
                role: "receptionist",
                clinicId: currentUser?.clinicId || ""
            })
            await fetchStaff()
        } catch (error: any) {
            console.error("Add staff error - Full error:", error)
            console.error("Error response:", error.response)
            console.error("Error config:", error.config)
            
            // Handle network errors specifically
            if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error") || !error.response) {
                const networkError = error.response?.data?.details || error.response?.data?.error || error.message || "Cannot connect to backend server. Please check if the server is running."
                toast.error(`Network Error: ${networkError}`)
            } else {
                // Handle API errors
                const errorData = error.response?.data || {}
                const errorMessage = errorData.message || errorData.error || error.message || "Failed to add staff member"
                toast.error(`Failed to add staff: ${errorMessage}`)
            }
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteStaff = async (userId: string) => {
        if (!confirm("Are you sure you want to deactivate this staff member? They will no longer be able to access the system.")) return

        try {
            console.log("Deactivating staff member:", userId)
            await userService.deleteUser(userId)
            toast.success("Staff member deactivated successfully")
            await fetchStaff()
        } catch (error: any) {
            console.error("Delete staff error - Full error:", error)
            console.error("Error response:", error.response)
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to deactivate staff member. You may not have permission to perform this action."
            toast.error(`Failed to deactivate: ${errorMessage}`)
        }
    }

    const filteredStaff = staff.filter(s =>
        s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Staff Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Staff Member</DialogTitle>
                            <DialogDescription>
                                Create an account for a new doctor or receptionist at your clinic.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddStaff} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={newStaff.firstName}
                                        onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={newStaff.lastName}
                                        onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={newStaff.email}
                                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={newStaff.phone}
                                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={newStaff.role}
                                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                >
                                    <option value="receptionist">Receptionist</option>
                                    <option value="doctor">Doctor</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Temporary Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={newStaff.password}
                                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={actionLoading}>
                                    {actionLoading ? "Adding..." : "Add Member"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Receptionists</CardTitle>
                    <CardDescription>Manage your front desk staff</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        Loading staff...
                                    </TableCell>
                                </TableRow>
                            ) : filteredStaff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No staff members found. Add a receptionist to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredStaff.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    {member.profileImage ? (
                                                        <img src={member.profileImage} alt="" className="w-8 h-8 rounded-full" />
                                                    ) : (
                                                        <UserIcon className="h-4 w-4" />
                                                    )}
                                                </div>
                                                {member.firstName} {member.lastName}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {member.email}</span>
                                                {member.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {member.phone}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize mr-2">
                                                {member.role.toLowerCase()}
                                            </Badge>
                                            <Badge variant={member.isActive ? "default" : "secondary"}>
                                                {member.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteStaff(member.id)}
                                                className="text-destructive hover:text-destructive/90"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
