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
    DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowRight, User, Stethoscope, Users } from "lucide-react"

export function GetStartedAction({ variant = "default", className }: { variant?: "default" | "outline", className?: string }) {
    const router = useRouter()
    const { isAuthenticated, user } = useAppSelector((state) => state.auth)
    const [open, setOpen] = useState(false)

    const handleGetStarted = () => {
        if (!isAuthenticated) {
            setOpen(true)
            return
        }

        // If user is already logged in, check role
        if (user?.role === "patient") {
            router.push("/dashboard")
        } else if (user?.role === "receptionist") {
            router.push("/dashboard")
        } else if (user?.role === "doctor") {
            // Check if doctor has paid/setup, otherwise onboarding
            // For now, assume onboarding landing
            router.push("/onboarding/doctor")
        } else {
            // Fallback for new/undefined roles
            setOpen(true)
        }
    }

    const handleRoleSelect = (role: string) => {
        // This is primarily for the flow where we might want to guide a *newly* signed up user 
        // who hasn't selected a role yet, but in this app's current auth flow, 
        // role is usually selected at signup. 
        // However, per user request, we show the modal if logic dictates.
        // Since current Signup likely forces role, this modal might be redundant for *existing* users 
        // but good for the "Guest -> Click -> Login -> Flow" if we had a generic "signup" without role first.

        // For this implementation, we simply redirect to the specific signup page for that role
        // if they aren't logged in (which is handled above), OR if they are logged in but somehow undefined.

        if (role === 'patient') router.push('/auth/signup?role=patient');
        if (role === 'doctor') router.push('/auth/signup?role=doctor');
        if (role === 'receptionist') router.push('/auth/signup?role=receptionist');
        setOpen(false);
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

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Welcome to PulseCal</DialogTitle>
                        <DialogDescription>
                            Choose your role to continue to your dashboard.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Button variant="outline" className="justify-start h-auto py-4" onClick={() => handleRoleSelect('patient')}>
                            <User className="mr-4 h-6 w-6 text-primary" />
                            <div className="text-left">
                                <div className="font-semibold">I'm a Patient</div>
                                <div className="text-xs text-muted-foreground">Book appointments & manage health</div>
                            </div>
                        </Button>
                        <Button variant="outline" className="justify-start h-auto py-4" onClick={() => handleRoleSelect('doctor')}>
                            <Stethoscope className="mr-4 h-6 w-6 text-primary" />
                            <div className="text-left">
                                <div className="font-semibold">I'm a Doctor</div>
                                <div className="text-xs text-muted-foreground">Manage consultations & patients</div>
                            </div>
                        </Button>
                        <Button variant="outline" className="justify-start h-auto py-4" onClick={() => handleRoleSelect('receptionist')}>
                            <Users className="mr-4 h-6 w-6 text-primary" />
                            <div className="text-left">
                                <div className="font-semibold">I'm a Receptionist</div>
                                <div className="text-xs text-muted-foreground">Manage clinic queue & records</div>
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
