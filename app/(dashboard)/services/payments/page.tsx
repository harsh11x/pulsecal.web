"use client"

import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, DollarSign, Calendar, Download, Plus } from "lucide-react"
import { formatCurrency } from "@/utils/helpers"

export default function Payments() {
  const bills = [
    {
      id: "1",
      date: "2024-12-15",
      description: "Annual Physical Exam",
      amount: 250.0,
      status: "paid",
      dueDate: "2024-12-20",
    },
    {
      id: "2",
      date: "2024-11-28",
      description: "Lab Tests - Blood Work",
      amount: 185.0,
      status: "pending",
      dueDate: "2025-01-05",
    },
    {
      id: "3",
      date: "2024-11-10",
      description: "Prescription Refills",
      amount: 45.0,
      status: "overdue",
      dueDate: "2024-12-10",
    },
  ]

  const paymentMethods = [
    { id: "1", type: "Visa", last4: "4242", expiry: "12/25", isDefault: true },
    { id: "2", type: "Mastercard", last4: "8888", expiry: "08/26", isDefault: false },
  ]

  const transactions = [
    { id: "1", date: "2024-12-15", description: "Payment for Annual Physical", amount: -250.0 },
    { id: "2", date: "2024-11-20", description: "Insurance Reimbursement", amount: 150.0 },
    { id: "3", date: "2024-10-15", description: "Payment for Lab Tests", amount: -185.0 },
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      paid: { color: "bg-success/10 text-success", label: "Paid" },
      pending: { color: "bg-warning/10 text-warning", label: "Pending" },
      overdue: { color: "bg-destructive/10 text-destructive", label: "Overdue" },
    }
    const statusInfo = variants[status] || variants.pending
    return (
      <Badge className={statusInfo.color} variant="secondary">
        {statusInfo.label}
      </Badge>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(230.0)}</p>
                <p className="text-sm text-muted-foreground mt-1">1 payment overdue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Paid This Year</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(1245.0)}</p>
                <p className="text-sm text-success mt-1">+12% from last year</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Next Payment Due</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(185.0)}</p>
                <p className="text-sm text-muted-foreground mt-1">Due Jan 5, 2025</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="bills" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="bills">Bills</TabsTrigger>
              <TabsTrigger value="methods">Payment Methods</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="bills" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Outstanding Bills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bills.map((bill) => (
                      <div
                        key={bill.id}
                        className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{bill.description}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {bill.dueDate}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(bill.amount)}</p>
                            {getStatusBadge(bill.status)}
                          </div>
                          {bill.status !== "paid" && (
                            <Button size="sm" className="ml-2">
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between border rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {method.type} •••• {method.last4}
                            </p>
                            <p className="text-sm text-muted-foreground">Expires {method.expiry}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {method.isDefault && <Badge>Default</Badge>}
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

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
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              transaction.amount > 0 ? "bg-success/10" : "bg-muted"
                            }`}
                          >
                            <DollarSign
                              className={`h-5 w-5 ${transaction.amount > 0 ? "text-success" : "text-muted-foreground"}`}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">{transaction.date}</p>
                          </div>
                        </div>
                        <p className={`font-semibold ${transaction.amount > 0 ? "text-success" : "text-foreground"}`}>
                          {transaction.amount > 0 ? "+" : ""}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

