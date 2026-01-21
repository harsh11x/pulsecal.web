"use client"

import DoctorScheduleManager from "@/components/dashboard/DoctorScheduleManager"

export default function SchedulePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Schedule Management</h1>
                <p className="text-muted-foreground">Manage your availability and working hours</p>
            </div>
            <DoctorScheduleManager />
        </div>
    )
}
