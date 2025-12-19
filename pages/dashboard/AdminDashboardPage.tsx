"use client"

import { useAppSelector } from "@/app/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { Button } from "@/components/ui/button"
import { Users, Calendar, DollarSign, Activity } from "lucide-react"
import Link from "next/link"

export default function AdminDashboardPage() {
  const user = useAppSelector((state) => state.auth.user)

  const stats = [
    {
      title: "Total Users",
      value: 1234,
      trend: { value: 12, isPositive: true, label: "from last month" },
      icon: Users,
      color: "blue" as const,
      description: "Registered users",
    },
    {
      title: "Appointments Today",
      value: 89,
      trend: { value: 5, isPositive: true, label: "from yesterday" },
      icon: Calendar,
      color: "green" as const,
      description: "Scheduled today",
    },
    {
      title: "Revenue",
      value: "$45,231",
      trend: { value: 20, isPositive: true, label: "this month" },
      icon: DollarSign,
      color: "purple" as const,
      description: "Total revenue",
    },
    {
      title: "Active Sessions",
      value: 234,
      trend: { value: 18, isPositive: true, label: "currently online" },
      icon: Activity,
      color: "indigo" as const,
      description: "Live sessions",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.firstName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard 
            key={stat.title} 
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            color={stat.color}
            description={stat.description}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/analytics">
                <Activity className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/reports">
                <DollarSign className="mr-2 h-4 w-4" />
                Generate Reports
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Server</span>
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Redis Cache</span>
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

