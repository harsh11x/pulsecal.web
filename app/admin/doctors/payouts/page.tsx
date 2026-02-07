"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CreditCard, Mail, Phone, Search, Wallet } from "lucide-react"
import { Input } from "@/components/ui/input"
import { apiService } from "@/services/api"

interface DoctorPayout {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  specialization?: string
  consultationFee?: number
  bankAccountDetails?: string | null
  upiId?: string | null
}

export default function DoctorPayoutsPage() {
  const [doctors, setDoctors] = useState<DoctorPayout[]>([])
  const [filtered, setFiltered] = useState<DoctorPayout[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDoctors()
  }, [])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(doctors)
      return
    }
    const q = search.toLowerCase()
    setFiltered(
      doctors.filter(
        (d) =>
          `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
          d.email?.toLowerCase().includes(q) ||
          d.phone?.includes(q)
      )
    )
  }, [search, doctors])

  const loadDoctors = async () => {
    try {
      setLoading(true)
      const res: any = await apiService.get("/admin/doctors/payouts")
      const list = res?.doctors ?? res ?? []
      setDoctors(Array.isArray(list) ? list : [])
      setFiltered(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error("Failed to load doctor payouts:", err)
      setDoctors([])
      setFiltered([])
    } finally {
      setLoading(false)
    }
  }

  const hasPayoutInfo = (d: DoctorPayout) =>
    (d.bankAccountDetails && d.bankAccountDetails.trim()) ||
    (d.upiId && d.upiId.trim())

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Doctor Payout Details</h1>
        <p className="mt-2 text-muted-foreground">
          Bank account or UPI details for paying doctors every 15 days
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Payout Information</CardTitle>
              <CardDescription>Use these details to transfer consultation fees to doctors</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No doctors found</p>
            ) : (
              filtered.map((d) => (
                <div
                  key={d.id}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">
                        Dr. {d.firstName} {d.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{d.specialization || "—"}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {d.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {d.email}
                        </span>
                      )}
                      {d.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {d.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {d.bankAccountDetails ? (
                      <div className="flex gap-2 rounded-md bg-muted/50 p-3">
                        <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Bank Details</p>
                          <p className="text-sm whitespace-pre-wrap">{d.bankAccountDetails}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 rounded-md border border-dashed p-3 opacity-60">
                        <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No bank details</p>
                      </div>
                    )}
                    {d.upiId ? (
                      <div className="flex gap-2 rounded-md bg-muted/50 p-3">
                        <CreditCard className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">UPI ID</p>
                          <p className="text-sm font-mono">{d.upiId}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 rounded-md border border-dashed p-3 opacity-60">
                        <CreditCard className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No UPI ID</p>
                      </div>
                    )}
                  </div>

                  {!hasPayoutInfo(d) && (
                    <p className="text-xs text-amber-600">
                      Doctor has not added payout details. Ask them to add bank or UPI in Profile.
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
