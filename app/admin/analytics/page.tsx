"use client"

import { Card } from "@/components/ui/card"
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react"
import { StatsCard } from "@/components/dashboard/StatsCard"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">Detailed insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value="$125.4k"
          icon={DollarSign}
          color="purple"
          trend={{ value: 15, isPositive: true, label: "from last month" }}
          description="Total platform revenue"
        />
        <StatsCard
          title="New Patients"
          value={342}
          icon={Users}
          color="green"
          trend={{ value: 12, isPositive: true, label: "this month" }}
          description="New registrations"
        />
        <StatsCard
          title="Appointments"
          value={1456}
          icon={Calendar}
          color="blue"
          trend={{ value: 8, isPositive: true, label: "this month" }}
          description="Total appointments"
        />
        <StatsCard
          title="Growth Rate"
          value="23%"
          icon={TrendingUp}
          color="indigo"
          trend={{ value: 5, isPositive: true, label: "monthly growth" }}
          description="Platform growth"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Chart visualization would be rendered here
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">User Distribution</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Pie chart visualization would be rendered here
          </div>
        </Card>
      </div>
    </div>
  )
}
