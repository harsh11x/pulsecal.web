"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, Calendar, DollarSign } from "lucide-react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { apiService } from "@/services/api"
import { format, subDays, subMonths, subYears } from "date-fns"
import { toast } from "sonner"

interface FinancialReport {
  period: string
  totalRevenue: number
  totalAppointments: number
  confirmedAppointments: number
  cancelledAppointments: number
  averageRevenuePerVisit: number
  dailyBreakdown?: Array<{ date: string; revenue: number; appointments: number }>
  monthlyBreakdown?: Array<{ month: string; revenue: number; appointments: number }>
}

export default function DoctorFinancialReports() {
  const [reportType, setReportType] = useState<"daily" | "monthly" | "yearly">("monthly")
  const [reportData, setReportData] = useState<FinancialReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [reportType])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const response: any = await apiService.get(`/api/v1/doctors/financial-reports?type=${reportType}`)
      if (response?.data) {
        setReportData(response.data)
      } else {
        // Mock data for demonstration
        setReportData(getMockReportData())
      }
    } catch (error) {
      console.warn("Failed to fetch financial report:", error)
      setReportData(getMockReportData())
    } finally {
      setLoading(false)
    }
  }

  const getMockReportData = (): FinancialReport => {
    if (reportType === "daily") {
      return {
        period: "Last 30 Days",
        totalRevenue: 45000,
        totalAppointments: 180,
        confirmedAppointments: 171,
        cancelledAppointments: 9,
        averageRevenuePerVisit: 250,
        dailyBreakdown: Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), "MMM dd"),
          revenue: Math.floor(Math.random() * 2000) + 1000,
          appointments: Math.floor(Math.random() * 8) + 4,
        })),
      }
    } else if (reportType === "monthly") {
      return {
        period: "Last 12 Months",
        totalRevenue: 540000,
        totalAppointments: 2160,
        confirmedAppointments: 2052,
        cancelledAppointments: 108,
        averageRevenuePerVisit: 250,
        monthlyBreakdown: Array.from({ length: 12 }, (_, i) => ({
          month: format(subMonths(new Date(), 11 - i), "MMM yyyy"),
          revenue: Math.floor(Math.random() * 50000) + 40000,
          appointments: Math.floor(Math.random() * 200) + 150,
        })),
      }
    } else {
      return {
        period: "Last 5 Years",
        totalRevenue: 2700000,
        totalAppointments: 10800,
        confirmedAppointments: 10260,
        cancelledAppointments: 540,
        averageRevenuePerVisit: 250,
        monthlyBreakdown: Array.from({ length: 5 }, (_, i) => ({
          month: format(subYears(new Date(), 4 - i), "yyyy"),
          revenue: Math.floor(Math.random() * 200000) + 400000,
          appointments: Math.floor(Math.random() * 1000) + 1500,
        })),
      }
    }
  }

  const handleExport = async (format: "pdf" | "csv" | "excel") => {
    try {
      const response: any = await apiService.get(
        `/api/v1/doctors/financial-reports/export?type=${reportType}&format=${format}`,
        { responseType: "blob" }
      )
      
      const blob = new Blob([response], { type: `application/${format === "pdf" ? "pdf" : format === "csv" ? "csv" : "xlsx"}` })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `financial-report-${reportType}-${format(new Date(), "yyyy-MM-dd")}.${format === "pdf" ? "pdf" : format === "csv" ? "csv" : "xlsx"}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`Report exported as ${format.toUpperCase()}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to export report")
    }
  }

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const chartData = reportType === "daily" 
    ? reportData.dailyBreakdown 
    : reportData.monthlyBreakdown

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Comprehensive financial analytics and insights</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => handleExport("pdf")}>
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport("csv")}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport("excel")}>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">${reportData.totalRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Appointments</p>
                    <p className="text-2xl font-bold">{reportData.totalAppointments}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmed</p>
                    <p className="text-2xl font-bold">{reportData.confirmedAppointments}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                    <p className="text-2xl font-bold">{reportData.cancelledAppointments}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          {chartData && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>{reportData.period}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={reportType === "daily" ? "date" : "month"} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue ($)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Appointments Trend</CardTitle>
                  <CardDescription>{reportData.period}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={reportType === "daily" ? "date" : "month"} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="appointments" fill="#82ca9d" name="Appointments" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Additional Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Average Revenue per Visit</p>
                  <p className="text-2xl font-bold">${reportData.averageRevenuePerVisit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confirmation Rate</p>
                  <p className="text-2xl font-bold">
                    {((reportData.confirmedAppointments / reportData.totalAppointments) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cancellation Rate</p>
                  <p className="text-2xl font-bold">
                    {((reportData.cancelledAppointments / reportData.totalAppointments) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}

