"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthForm } from "@/components/auth/AuthForm"

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    defaultTab?: "signin" | "signup"
}

export function AuthModal({ isOpen, onClose, defaultTab = "signin" }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState(defaultTab)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold">
                        Welcome to PulseCal
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "signup")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="signin">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="signin" className="mt-6">
                        <AuthForm mode="signin" onSuccess={onClose} />
                    </TabsContent>

                    <TabsContent value="signup" className="mt-6">
                        <AuthForm mode="signup" onSuccess={onClose} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
