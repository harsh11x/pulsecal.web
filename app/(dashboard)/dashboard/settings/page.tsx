"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SecuritySettings from "@/components/dashboard/settings/SecuritySettings"
import AccountSettings from "@/components/dashboard/settings/AccountSettings"
import NotificationSettings from "@/components/dashboard/settings/NotificationSettings"
import { Settings, Shield, Bell, User } from "lucide-react"

export default function SettingsPage() {
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
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
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
            </Tabs>
        </div>
    )
}
