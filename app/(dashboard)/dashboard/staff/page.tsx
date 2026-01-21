
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function StaffManagementPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Clinic Staff</CardTitle>
                    <CardDescription>Manage doctors and receptionists</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Staff management features coming soon...</p>
                </CardContent>
            </Card>
        </div>
    )
}
