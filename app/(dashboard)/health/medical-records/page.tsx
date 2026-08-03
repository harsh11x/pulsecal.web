"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, FileText, User, Loader2, ArrowDownAZ, CalendarDays, Search } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { AddMedicalRecordDialog, type MedicalRecordPrefill } from "@/components/medical-records/AddMedicalRecordDialog"
import { apiService } from "@/services/api"
import { useAppSelector } from "@/app/hooks"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SortMode = "date-desc" | "date-asc" | "name-asc" | "name-desc"

export default function MedicalRecordsPage() {
  const { user } = useAppSelector((state) => state.auth)
  const isDoctor = user?.role?.toLowerCase() === "doctor"
  const isStaff = ["doctor", "receptionist", "admin"].includes(user?.role?.toLowerCase() || "")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [prefill, setPrefill] = useState<MedicalRecordPrefill | null>(null)
  const [editRecord, setEditRecord] = useState<any | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState<SortMode>("date-desc")
  const [search, setSearch] = useState("")
  const searchParams = useSearchParams()

  const openNewNote = (nextPrefill: MedicalRecordPrefill | null = null) => {
    setEditRecord(null)
    setPrefill(nextPrefill)
    setDialogOpen(true)
  }

  const openEditNote = (record: any) => {
    setPrefill(null)
    setEditRecord(record)
    setDialogOpen(true)
  }

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      const patientName = searchParams.get("patientName") || undefined
      const patientId = searchParams.get("patientId") || undefined
      const appointmentId = searchParams.get("appointmentId") || undefined
      const visitDate = searchParams.get("visitDate") || undefined
      const reason = searchParams.get("reason") || undefined
      if (patientName || patientId || appointmentId) {
        openNewNote({ patientName, patientId, appointmentId, visitDate: visitDate || undefined, reason })
      } else {
        openNewNote(null)
      }
    }
  }, [searchParams])

  useEffect(() => {
    const handleOpenDialog = (event: Event) => {
      const detail = (event as CustomEvent<MedicalRecordPrefill>).detail
      openNewNote(detail || null)
    }
    window.addEventListener("open-add-medical-record", handleOpenDialog as EventListener)
    return () => window.removeEventListener("open-add-medical-record", handleOpenDialog as EventListener)
  }, [])

  const sortQuery = useMemo(() => {
    switch (sortMode) {
      case "date-asc":
        return { sortBy: "recordDate", sortOrder: "asc" }
      case "name-asc":
        return { sortBy: "patientName", sortOrder: "asc" }
      case "name-desc":
        return { sortBy: "patientName", sortOrder: "desc" }
      default:
        return { sortBy: "recordDate", sortOrder: "desc" }
    }
  }, [sortMode])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        sortBy: sortQuery.sortBy,
        sortOrder: sortQuery.sortOrder,
        limit: "100",
      })
      if (search.trim()) params.set("search", search.trim())
      const response: any = await apiService.get(`/medical-records?${params.toString()}`)
      const list = Array.isArray(response) ? response : (response?.data || response?.records || [])
      setRecords(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error("Failed to fetch medical records:", error)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [sortMode])

  const handleSuccess = () => {
    fetchRecords()
  }

  const patientLabel = (record: any) =>
    record.displayPatientName ||
    record.patientName ||
    `${record.patient?.firstName || ""} ${record.patient?.lastName || ""}`.trim() ||
    "Unknown patient"

  // Client-side secondary grouping by patient name when sorting by date (Halaxy-like readability)
  const groupedByName = useMemo(() => {
    if (!sortMode.startsWith("name")) return null
    const groups = new Map<string, any[]>()
    for (const record of records) {
      const key = patientLabel(record) || "Unknown"
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(record)
    }
    return Array.from(groups.entries())
  }, [records, sortMode])

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clinical notes</h1>
          <p className="text-muted-foreground">
            {isDoctor ? "Patient notes sorted by date or name" : "My health records"}
          </p>
        </div>
        {isStaff && (
          <Button onClick={() => openNewNote(null)}>
            <Plus className="mr-2 h-4 w-4" />
            New note
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient, title, diagnosis…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchRecords()
            }}
          />
        </div>
        <Button variant="outline" onClick={fetchRecords}>
          Search
        </Button>
        <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" /> Newest first
              </span>
            </SelectItem>
            <SelectItem value="date-asc">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" /> Oldest first
              </span>
            </SelectItem>
            <SelectItem value="name-asc">
              <span className="flex items-center gap-2">
                <ArrowDownAZ className="h-3.5 w-3.5" /> Patient name A–Z
              </span>
            </SelectItem>
            <SelectItem value="name-desc">
              <span className="flex items-center gap-2">
                <ArrowDownAZ className="h-3.5 w-3.5" /> Patient name Z–A
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : records.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No clinical notes yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {isStaff
                ? "Add a note with any patient name — no existing account required."
                : "You don't have any medical records."}
            </p>
            {isStaff && (
              <Button onClick={() => openNewNote(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add note
              </Button>
            )}
          </CardContent>
        </Card>
      ) : groupedByName ? (
        <div className="space-y-8">
          {groupedByName.map(([name, group]) => (
            <div key={name} className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                <User className="h-4 w-4" />
                {name}
                <Badge variant="secondary" className="ml-1">
                  {group.length}
                </Badge>
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {group.map((record) => (
                  <NoteCard
                    key={record.id}
                    record={record}
                    patientLabel={patientLabel(record)}
                    showPatient={false}
                    onOpen={() => openEditNote(record)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {records.map((record) => (
            <NoteCard
              key={record.id}
              record={record}
              patientLabel={patientLabel(record)}
              showPatient
              onOpen={() => openEditNote(record)}
            />
          ))}
        </div>
      )}

      <AddMedicalRecordDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setPrefill(null)
            setEditRecord(null)
          }
        }}
        onSuccess={handleSuccess}
        prefill={prefill}
        editRecord={editRecord}
      />
    </div>
  )
}

function NoteCard({
  record,
  patientLabel,
  showPatient,
  onOpen,
}: {
  record: any
  patientLabel: string
  showPatient: boolean
  onOpen: () => void
}) {
  const dateValue = record.recordDate || record.visitDate || record.createdAt
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base truncate">
              {record.title || record.diagnosis || "Clinical note"}
            </CardTitle>
            {showPatient && (
              <CardDescription className="flex items-center gap-2">
                <User className="h-3 w-3" />
                {patientLabel}
              </CardDescription>
            )}
          </div>
          <Badge variant="outline" className="shrink-0">
            {dateValue ? format(new Date(dateValue), "MMM d, yyyy") : "—"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {record.diagnosis && (
          <p className="text-sm">
            <span className="font-medium">Diagnosis:</span> {record.diagnosis}
          </p>
        )}
        {record.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
            {record.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{record.recordType || "NOTE"}</Badge>
          {record.appointmentId && <Badge variant="outline">Linked appointment</Badge>}
          <span className="text-xs text-muted-foreground self-center ml-auto">Click to view / edit</span>
        </div>
      </CardContent>
    </Card>
  )
}
