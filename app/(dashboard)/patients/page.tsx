
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PatientsDirectoryPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Patient Directory</h1>
            <Card>
                <CardHeader>
                    <CardTitle>All Patients</CardTitle>
                    <CardDescription>Directory of all registered patients</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Patient directory features coming soon...</p>
                </CardContent>
            </Card>
        </div>
    )
}
