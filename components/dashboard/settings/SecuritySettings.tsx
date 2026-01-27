"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Lock, Loader2, AlertCircle } from "lucide-react"
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth"
import { getAuthInstance } from "@/lib/firebase"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SecuritySettings() {
    const [loading, setLoading] = useState(false)
    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords({ ...passwords, [e.target.id]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (passwords.new !== passwords.confirm) {
            toast.error("New passwords do not match")
            return
        }

        if (passwords.new.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        setLoading(true)
        try {
            const auth = getAuthInstance()
            const user = auth.currentUser

            if (!user || !user.email) {
                toast.error("No user logged in. Please sign in again.")
                return
            }

            // Check if user signed in with Google (no password)
            const providerData = user.providerData
            const hasPasswordProvider = providerData.some(p => p.providerId === "password")
            
            if (!hasPasswordProvider) {
                toast.error("You signed in with Google. Password changes are not available for Google accounts.")
                return
            }

            // Re-authenticate user with current password
            const credential = EmailAuthProvider.credential(user.email, passwords.current)
            await reauthenticateWithCredential(user, credential)

            // Update password
            await updatePassword(user, passwords.new)
            
            toast.success("Password changed successfully!")
            setPasswords({ current: "", new: "", confirm: "" })
        } catch (error: any) {
            console.error("Password change error:", error)
            
            if (error.code === "auth/wrong-password") {
                toast.error("Current password is incorrect")
            } else if (error.code === "auth/requires-recent-login") {
                toast.error("Please sign out and sign in again before changing your password")
            } else if (error.code === "auth/weak-password") {
                toast.error("Password is too weak. Please use a stronger password.")
            } else {
                toast.error(error.message || "Failed to change password")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                        <Label htmlFor="current">Current Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="current"
                                type="password"
                                className="pl-9"
                                value={passwords.current}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new">New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="new"
                                type="password"
                                className="pl-9"
                                value={passwords.new}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm">Confirm New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirm"
                                type="password"
                                className="pl-9"
                                value={passwords.confirm}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Change Password"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
