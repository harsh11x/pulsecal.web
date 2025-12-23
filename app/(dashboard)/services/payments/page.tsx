"use client"

import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, DollarSign, Calendar, Download, Plus, Loader2 } from "lucide-react"
import { formatCurrency } from "@/utils/helpers"
import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { format } from "date-fns"

export default function Payments() {
  const [data, setData] = useState<any>({ transactions: [], summary: { totalPaid: 0, totalPending: 0 } })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response: any = await apiService.get("/api/v1/patients/payments")
        setData(response.data || { transactions: [], summary: { totalPaid: 0, totalPending: 0 } })
      } catch (error) {
        console.error("Failed to fetch payments:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      COMPLETED: { color: "bg-green-100 text-green-700", label: "Paid" },
      PENDING: { color: "bg-yellow-100 text-yellow-700", label: "Pending" },
      FAILED: { color: "bg-red-100 text-red-700", label: "Failed" },
    }
    const statusInfo = variants[status] || variants.PENDING
    return (
      <Badge className={statusInfo.color} variant="secondary">
        {statusInfo.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProtectedRoute>
    )
  }

  const { transactions, summary } = data

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Payments & Billing</h1>
            <p className="text-muted-foreground">Manage your payments and billing information</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid (Lifetime)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(summary.totalPaid)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(summary.totalPending)}</p>
              {summary.totalPending > 0 && <p className="text-sm text-yellow-600 mt-1">Action required</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Next Payment Due</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(0)}</p>
              <p className="text-sm text-muted-foreground mt-1">No upcoming bills</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Transaction History</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction: any) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${transaction.amount > 0 ? "bg-green-100" : "bg-muted"
                              }`}
                          >
                            <DollarSign
                              className={`h-5 w-5 ${transaction.amount > 0 ? "text-green-600" : "text-muted-foreground"}`}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description || "Payment"}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {formatCurrency(transaction.amount)}
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Saved Payment Methods</CardTitle>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Method
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No payment methods saved.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}

