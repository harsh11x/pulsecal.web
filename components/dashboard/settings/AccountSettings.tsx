"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Trash2, Loader2, Save, Check } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { userService } from "@/services/user.service"
import { apiService } from "@/services/api"
import { useRouter } from "next/navigation"
import { logout, setUser } from "@/app/features/authSlice"
import { logOut } from "@/lib/firebaseAuth"
import { mapAuthProfileToUser } from "@/lib/mapAuthUser"

function toDateInputValue(value?: string | Date | null) {
    if (!value) return ""
    const d = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(d.getTime())) {
        // already YYYY-MM-DD
        return String(value).slice(0, 10)
    }
    return d.toISOString().slice(0, 10)
}

export default function AccountSettings() {
    const user = useAppSelector((state) => state.auth.user)
    const dispatch = useAppDispatch()
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const router = useRouter()

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        dateOfBirth: "",
    })

    // Hydrate when Redux user arrives (auth is async)
    useEffect(() => {
        if (!user) return
        setFormData({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phone: user.phone || "",
            dateOfBirth: toDateInputValue(user.dateOfBirth as any),
        })
        setSaved(false)
    }, [user?.id, user?.firstName, user?.lastName, user?.phone, user?.dateOfBirth])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.id) {
            toast.error("You must be signed in to update your profile")
            return
        }
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            toast.error("First name and last name are required")
            return
        }

        setLoading(true)
        setSaved(false)
        try {
            const payload: Record<string, unknown> = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                phone: formData.phone.trim() || null,
            }
            if (formData.dateOfBirth) {
                const d = new Date(formData.dateOfBirth)
                if (!Number.isNaN(d.getTime())) {
                    payload.dateOfBirth = d.toISOString()
                }
            }

            await userService.updateProfile(payload as any)

            // Refresh canonical profile so all dashboards see the same data
            let refreshed: any = null
            try {
                refreshed = await apiService.get("/auth/profile")
            } catch {
                refreshed = null
            }

            if (refreshed?.id) {
                dispatch(setUser(mapAuthProfileToUser(refreshed, {
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    phone: formData.phone.trim() || undefined,
                })))
            } else {
                dispatch(setUser({
                    ...user,
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    phone: formData.phone.trim() || undefined,
                    dateOfBirth: formData.dateOfBirth || user.dateOfBirth,
                }))
            }

            setSaved(true)
            toast.success("Saved")
            window.setTimeout(() => setSaved(false), 3000)
        } catch (error: any) {
            console.error("Account profile save error:", error)
            const message =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Failed to save profile"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (!user?.id) {
            toast.error("You must be signed in to delete your account")
            return
        }

        setDeleting(true)
        try {
            await userService.deleteUser(user.id)
            toast.success("Account deleted successfully")
            try {
                await logOut()
            } catch {
                /* ignore firebase logout errors after account delete */
            }
            dispatch(logout())
            router.push("/auth/login")
        } catch (error: any) {
            console.error("Delete account error:", error)
            const message =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Failed to delete account"
            toast.error(message)
            setDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your name, phone, and date of birth</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => {
                                        setSaved(false)
                                        setFormData({ ...formData, firstName: e.target.value })
                                    }}
                                    required
                                    autoComplete="given-name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => {
                                        setSaved(false)
                                        setFormData({ ...formData, lastName: e.target.value })
                                    }}
                                    required
                                    autoComplete="family-name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" value={user?.email || ""} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        setSaved(false)
                                        setFormData({ ...formData, phone: e.target.value })
                                    }}
                                    placeholder="+91 98765 43210"
                                    autoComplete="tel"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => {
                                        setSaved(false)
                                        setFormData({ ...formData, dateOfBirth: e.target.value })
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Input value={user?.role || ""} className="capitalize" disabled />
                            </div>
                        </div>

                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : saved ? (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Saved
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible account actions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-destructive flex items-center gap-2">
                                <Trash2 className="h-4 w-4" />
                                Delete Account
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete your account and all associated data.
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Delete Account</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your
                                        account and remove your data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteAccount}
                                        className="bg-destructive hover:bg-destructive/90"
                                        disabled={deleting}
                                    >
                                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Account"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
