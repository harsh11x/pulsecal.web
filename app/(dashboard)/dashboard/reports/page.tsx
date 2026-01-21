
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Financial Reports</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Revenue & Analytics</CardTitle>
                    <CardDescription>Detailed financial reports and insights</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Advanced reporting features coming soon...</p>
                </CardContent>
            </Card>
        </div>
    )
}
