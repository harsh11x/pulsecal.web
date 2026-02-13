"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SecuritySettings from "@/components/dashboard/settings/SecuritySettings"
import AccountSettings from "@/components/dashboard/settings/AccountSettings"
import NotificationSettings from "@/components/dashboard/settings/NotificationSettings"
import ClinicManager from "@/components/dashboard/ClinicManager"
import { Settings, Shield, Bell, User, Building2 } from "lucide-react"
import { useAppSelector } from "@/app/hooks"

export default function SettingsPage() {
    const user = useAppSelector((state) => state.auth.user)
    // Only admins or head doctors (who can manage subscription) can edit clinic
    const canEditClinic = user?.role === "admin" || (user?.role === "doctor" && (user as any)?.canManageSubscription !== false)
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Settings className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground">Manage your account preferences and security</p>
                </div>
            </div>

            <Tabs defaultValue="account" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                    <TabsTrigger value="account" className="gap-2">
                        <User className="h-4 w-4" />
                        Account
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                    {canEditClinic && (
                        <TabsTrigger value="clinic" className="gap-2">
                            <Building2 className="h-4 w-4" />
                            Clinic
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="account">
                    <AccountSettings />
                </TabsContent>

                <TabsContent value="security">
                    <SecuritySettings />
                </TabsContent>

                <TabsContent value="notifications">
                    <NotificationSettings />
                </TabsContent>

                {canEditClinic && (
                    <TabsContent value="clinic">
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold">Clinic Information</h2>
                                <p className="text-muted-foreground">Manage your clinic's public details</p>
                            </div>
                            <ClinicManager clinicId={user?.clinicId || ""} />
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}
