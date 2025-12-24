"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAppSelector } from "@/app/hooks"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ArrowRight, User, Stethoscope, Users } from "lucide-react"
import { AuthForm } from "@/components/auth/AuthForm"

export function GetStartedAction({ variant = "default", className }: { variant?: "default" | "outline", className?: string }) {
    const router = useRouter()
    const { isAuthenticated, user } = useAppSelector((state) => state.auth)
    const [roleDialogOpen, setRoleDialogOpen] = useState(false)
    const [authDialogOpen, setAuthDialogOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | "receptionist" | null>(null)

    const handleGetStarted = () => {
        if (isAuthenticated && user) {
            // User is already logged in, redirect to dashboard
            router.push("/dashboard")
            return
        }

        // Show role selection dialog
        setRoleDialogOpen(true)
    }

    const handleRoleSelect = (role: "patient" | "doctor" | "receptionist") => {
        setSelectedRole(role)
        setRoleDialogOpen(false)

        // Store role in sessionStorage for auth flow
        sessionStorage.setItem('selectedRole', role.toUpperCase())

        // Show auth dialog
        setAuthDialogOpen(true)
    }

    const handleAuthSuccess = () => {
        setAuthDialogOpen(false)

        // The AuthForm will handle routing based on role
        // Just close the dialog
    }

    return (
        <>
            <Button
                size="lg"
                variant={variant}
                className={className}
                onClick={handleGetStarted}
            >
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {/* Role Selection Dialog */}
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Welcome to PulseCal</DialogTitle>
                        <DialogDescription className="text-base">
                            Choose your role to get started with the right experience
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-6">
                        <Button
                            variant="outline"
                            className="justify-start h-auto py-6 hover:border-primary hover:bg-primary/5 transition-all"
                            onClick={() => handleRoleSelect('patient')}
                        >
                            <User className="mr-4 h-8 w-8 text-primary" />
                            <div className="text-left">
                                <div className="font-semibold text-lg">I'm a Patient</div>
                                <div className="text-sm text-muted-foreground">Book appointments & manage your health</div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start h-auto py-6 hover:border-primary hover:bg-primary/5 transition-all"
                            onClick={() => handleRoleSelect('doctor')}
                        >
                            <Stethoscope className="mr-4 h-8 w-8 text-primary" />
                            <div className="text-left">
                                <div className="font-semibold text-lg">I'm a Doctor</div>
                                <div className="text-sm text-muted-foreground">Manage consultations & grow your practice</div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start h-auto py-6 hover:border-primary hover:bg-primary/5 transition-all"
                            onClick={() => handleRoleSelect('receptionist')}
                        >
                            <Users className="mr-4 h-8 w-8 text-primary" />
                            <div className="text-left">
                                <div className="font-semibold text-lg">I'm a Receptionist</div>
                                <div className="text-sm text-muted-foreground">Manage clinic queue & patient records</div>
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Auth Dialog (Signup/Login) */}
            <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <AuthForm
                        mode="signup"
                        selectedRole={selectedRole}
                        onSuccess={handleAuthSuccess}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
