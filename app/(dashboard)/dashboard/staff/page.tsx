
"use client"

import StaffManager from "@/components/dashboard/StaffManager"

export default function StaffManagementPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Staff Management</h1>
                <p className="text-muted-foreground">Manage your clinic's team members</p>
            </div>
            <StaffManager />
        </div>
    )
}
