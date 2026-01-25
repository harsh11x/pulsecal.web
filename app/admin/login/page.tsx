"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch } from "@/app/hooks"
import { setCredentials } from "@/features/auth/authSlice"
import { apiService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Shield, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { signInWithEmailAndPassword } from "firebase/auth"
import { getAuthInstance } from "@/lib/firebase"

export default function AdminLoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const dispatch = useAppDispatch()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const auth = getAuthInstance()
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            const idToken = await userCredential.user.getIdToken()

            // Sync user with backend to get role and details
            const response: any = await apiService.post(
                "/auth/sync-profile",
                {
                    // We can pass empty body or specific fields if needed
                    // mainly we need the backend to cr eating/fetching the user based on token
                    email: userCredential.user.email
                },
                {
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                }
            )

            const user = response.data

            if (user.role !== "ADMIN") {
                toast.error("Access Denied: You must be an administrator to log in here.")
                // Optionally sign out from firebase if not admin
                await auth.signOut()
                return
            }

            dispatch(setCredentials({ user, token: idToken }))
            toast.success(`Welcome back, Admin ${user.firstName}!`)
            router.push("/admin/dashboard")
        } catch (error: any) {
            console.error("Login failed:", error)
            const errorCode = error.code
            let errorMessage = "Invalid credentials"

            if (errorCode === 'auth/user-not-found') {
                errorMessage = "No admin account found with this email"
            } else if (errorCode === 'auth/wrong-password') {
                errorMessage = "Incorrect password"
            } else if (errorCode === 'auth/too-many-requests') {
                errorMessage = "Too many failed attempts. Try again later."
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            }

            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
                    <CardDescription>Secure access for PulseCal administrators</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email / Username</Label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="admin@pulsecal.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="pr-10"
                                />
                                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                "Access Dashboard"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4 bg-muted/20">
                    <p className="text-xs text-muted-foreground text-center">
                        Unauthorized access is strictly prohibited.<br />
                        IP Addresses are logged.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
