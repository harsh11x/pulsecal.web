"use client"

import DoctorFinancialReports from "@/components/dashboard/DoctorFinancialReports"

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Financial Reports</h1>
                <p className="text-muted-foreground">View your revenue and financial performance</p>
            </div>
            <DoctorFinancialReports />
        </div>
    )
}
