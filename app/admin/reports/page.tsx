"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, TrendingUp, Users, DollarSign } from "lucide-react"

export default function ReportsPage() {
  const reports = [
    {
      id: 1,
      title: "Appointments Report",
      description: "Detailed report of all appointments",
      icon: FileText,
      color: "bg-primary",
    },
    {
      id: 2,
      title: "Revenue Report",
      description: "Financial performance and revenue analytics",
      icon: DollarSign,
      color: "bg-success",
    },
    {
      id: 3,
      title: "User Growth Report",
      description: "User registration and growth trends",
      icon: Users,
      color: "bg-secondary",
    },
    {
      id: 4,
      title: "Performance Metrics",
      description: "System performance and usage statistics",
      icon: TrendingUp,
      color: "bg-accent",
    },
  ]

  const handleDownload = (reportTitle: string) => {
    console.log("[v0] Downloading report:", reportTitle)
    alert(`Downloading ${reportTitle}...`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-2">Generate and download system reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${report.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                  <Button size="sm" onClick={() => handleDownload(report.title)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
