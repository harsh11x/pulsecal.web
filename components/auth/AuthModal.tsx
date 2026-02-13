"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthForm } from "@/components/auth/AuthForm"

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    defaultTab?: "signin" | "signup"
    selectedRole?: "doctor" | "patient" | "receptionist" | null
}

export function AuthModal({ isOpen, onClose, defaultTab = "signin", selectedRole }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState(defaultTab)

    // Reset tab when modal opens/changes
    useEffect(() => {
        setActiveTab(defaultTab)
    }, [defaultTab, isOpen])

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold">
                        Welcome to PulseCal
                        {selectedRole && <span className="block text-sm font-normal text-muted-foreground mt-1 capitalize">For {selectedRole}s</span>}
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "signup")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="signin">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="signin" className="mt-6">
                        <AuthForm mode="signin" onSuccess={onClose} selectedRole={selectedRole} />
                    </TabsContent>

                    <TabsContent value="signup" className="mt-6">
                        <AuthForm mode="signup" onSuccess={onClose} selectedRole={selectedRole} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
