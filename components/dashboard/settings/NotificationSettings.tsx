"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Bell, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function NotificationSettings() {
    const [loading, setLoading] = useState(false)
    const [settings, setSettings] = useState({
        emailNotifications: true,
        appointmentReminders: true,
        marketingEmails: false,
        securityAlerts: true
    })

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800))

            // In a real app, you would save this to the backend
            // await userService.updateNotificationSettings(settings)

            toast.success("Notification preferences saved")
        } catch (error) {
            toast.error("Failed to save preferences")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what you want to be notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                        <Label htmlFor="email" className="text-base font-medium">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive emails about your account activity</p>
                    </div>
                    <Switch
                        id="email"
                        checked={settings.emailNotifications}
                        onCheckedChange={() => handleToggle("emailNotifications")}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                        <Label htmlFor="reminders" className="text-base font-medium">Appointment Reminders</Label>
                        <p className="text-sm text-muted-foreground">Get reminded before your upcoming appointments</p>
                    </div>
                    <Switch
                        id="reminders"
                        checked={settings.appointmentReminders}
                        onCheckedChange={() => handleToggle("appointmentReminders")}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                        <Label htmlFor="marketing" className="text-base font-medium">Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">Receive news, updates, and special offers</p>
                    </div>
                    <Switch
                        id="marketing"
                        checked={settings.marketingEmails}
                        onCheckedChange={() => handleToggle("marketingEmails")}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                        <Label htmlFor="security" className="text-base font-medium">Security Alerts</Label>
                        <p className="text-sm text-muted-foreground">Get notified about important security alerts</p>
                    </div>
                    <Switch
                        id="security"
                        checked={settings.securityAlerts}
                        disabled
                    />
                </div>

                <Button onClick={handleSave} disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Preferences"
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
