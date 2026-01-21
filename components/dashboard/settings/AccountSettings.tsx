"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Trash2, Loader2 } from "lucide-react"
import { useAppSelector } from "@/app/hooks"
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
import { useRouter } from "next/navigation"

export default function AccountSettings() {
    const user = useAppSelector((state) => state.auth.user)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleDeleteAccount = async () => {
        setLoading(true)
        try {
            if (user?.id) {
                await userService.deleteUser(user.id)
                toast.success("Account deleted successfully")
                router.push("/auth/login")
            }
        } catch (error: any) {
            console.error("Delete account error:", error)
            toast.error("Failed to delete account")
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>View your basic account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>User ID</Label>
                            <Input value={user?.id || ""} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Input value={user?.role || ""} className="capitalize" disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user?.email || ""} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Member Since</Label>
                            <Input value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""} disabled />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible account actions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
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
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Account"}
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
