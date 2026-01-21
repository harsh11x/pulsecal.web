
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ScheduleManagementPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Schedule Management</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Availability</CardTitle>
                    <CardDescription>Set your working hours and breaks</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Schedule management features coming soon...</p>
                </CardContent>
            </Card>
        </div>
    )
}
