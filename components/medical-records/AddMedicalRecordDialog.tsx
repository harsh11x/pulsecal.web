"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import { useAppSelector } from "@/app/hooks"
import { format } from "date-fns"
import { CalendarDays, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export interface MedicalRecordPrefill {
  patientId?: string
  patientName?: string
  patientPhone?: string
  appointmentId?: string
  visitDate?: string
  reason?: string
}

interface AddMedicalRecordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  prefill?: MedicalRecordPrefill | null
  /** Existing record to view/edit — when set, dialog saves via PUT */
  editRecord?: any | null
}

const emptyForm = () => ({
  patientName: "",
  visitDate: format(new Date(), "yyyy-MM-dd"),
  title: "",
  notes: "",
  diagnosis: "",
  symptoms: "",
  bloodPressure: "",
  heartRate: "",
  temperature: "",
  weight: "",
  height: "",
  bloodGroup: "",
  prescribedMedicines: "",
  medicalTests: "",
})

function mapRecordToForm(record: any) {
  const clinical = record?.clinicalData || {}
  const vitals = record?.vitalSigns || clinical.vitalSigns || {}
  const medicines = record?.prescribedMedicines || clinical.prescribedMedicines || []
  const tests = record?.medicalTests || clinical.medicalTests || []
  const dateValue = record.recordDate || record.visitDate || record.createdAt
  let notes =
    record.notes ||
    clinical.notes ||
    ""
  // Fallback: description may include notes + "Symptoms: ..." from create
  if (!notes && record.description) {
    const desc = String(record.description)
    const symptomsIdx = desc.indexOf("\n\nSymptoms:")
    notes = symptomsIdx >= 0 ? desc.slice(0, symptomsIdx).trim() : desc.trim()
  }
  let symptoms = record.symptoms || clinical.symptoms || ""
  if (!symptoms && record.description) {
    const match = String(record.description).match(/Symptoms:\s*([\s\S]*)$/i)
    if (match) symptoms = match[1].trim()
  }

  return {
    patientName:
      record.displayPatientName ||
      record.patientName ||
      `${record.patient?.firstName || ""} ${record.patient?.lastName || ""}`.trim() ||
      "",
    visitDate: dateValue ? format(new Date(dateValue), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    title: record.title || "",
    notes,
    diagnosis: record.diagnosis || "",
    symptoms,
    bloodPressure: vitals.bloodPressure ? String(vitals.bloodPressure) : "",
    heartRate: vitals.heartRate != null ? String(vitals.heartRate) : "",
    temperature: vitals.temperature != null ? String(vitals.temperature) : "",
    weight: vitals.weight != null ? String(vitals.weight) : "",
    height: vitals.height != null ? String(vitals.height) : "",
    bloodGroup: record.bloodGroup || clinical.bloodGroup || "",
    prescribedMedicines: Array.isArray(medicines) ? medicines.join(", ") : String(medicines || ""),
    medicalTests: Array.isArray(tests) ? tests.join(", ") : String(tests || ""),
  }
}

export function AddMedicalRecordDialog({
  open,
  onOpenChange,
  onSuccess,
  prefill = null,
  editRecord = null,
}: AddMedicalRecordDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingRecord, setLoadingRecord] = useState(false)
  const [showExtras, setShowExtras] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [doctorPatients, setDoctorPatients] = useState<any[]>([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [appointmentId, setAppointmentId] = useState<string | undefined>()

  const { user } = useAppSelector((state) => state.auth)
  const isDoctor = user?.role?.toLowerCase() === "doctor"
  const isEdit = !!editingId

  const [formData, setFormData] = useState(emptyForm)

  const resetForm = () => {
    setFormData(emptyForm())
    setSelectedPatientId("")
    setShowExtras(false)
    setEditingId(null)
    setAppointmentId(undefined)
  }

  // Load create prefill or edit record when dialog opens
  useEffect(() => {
    if (!open) return

    let cancelled = false

    const load = async () => {
      if (editRecord?.id) {
        setEditingId(editRecord.id)
        setAppointmentId(editRecord.appointmentId || undefined)
        setFormData(mapRecordToForm(editRecord))
        if (editRecord.patientId) setSelectedPatientId(editRecord.patientId)
        setLoadingRecord(true)
        try {
          const detail: any = await apiService.get(`/medical-records/${editRecord.id}`)
          const full = detail?.id ? detail : detail?.data || detail
          if (!cancelled && full?.id) {
            setFormData(mapRecordToForm(full))
            if (full.patientId) setSelectedPatientId(full.patientId)
            setAppointmentId(full.appointmentId || undefined)
            const hasExtras =
              !!(full.symptoms || full.vitalSigns || full.bloodGroup ||
                (full.prescribedMedicines && full.prescribedMedicines.length) ||
                (full.medicalTests && full.medicalTests.length))
            if (hasExtras) setShowExtras(true)
          }
        } catch (e) {
          console.error("Failed to load clinical note detail:", e)
          // Keep list-card data already mapped
        } finally {
          if (!cancelled) setLoadingRecord(false)
        }
        return
      }

      setEditingId(null)
      if (prefill) {
        const visitDate = prefill.visitDate
          ? format(new Date(prefill.visitDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd")
        setFormData({
          ...emptyForm(),
          patientName: prefill.patientName || "",
          visitDate,
          title: prefill.reason ? `Consultation — ${prefill.reason}` : "",
          notes: prefill.reason ? `Appointment reason: ${prefill.reason}` : "",
        })
        if (prefill.patientId) setSelectedPatientId(prefill.patientId)
        setAppointmentId(prefill.appointmentId)
      } else {
        resetForm()
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, editRecord, prefill])

  useEffect(() => {
    if (!open || !isDoctor) return
    const loadDoctorPatients = async () => {
      setPatientsLoading(true)
      try {
        const response: any = await apiService.get("/doctors/patients")
        const patients = Array.isArray(response) ? response : (response?.patients || [])
        setDoctorPatients(patients)
      } catch {
        setDoctorPatients([])
      } finally {
        setPatientsLoading(false)
      }
    }
    loadDoctorPatients()
  }, [open, isDoctor])

  const handleSelectDoctorPatient = (patientId: string) => {
    if (patientId === "__manual__") {
      setSelectedPatientId("")
      return
    }
    const patient = doctorPatients.find((p) => p.id === patientId)
    if (!patient) return
    setSelectedPatientId(patient.id)
    setFormData((prev) => ({
      ...prev,
      patientName: `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const patientName = formData.patientName.trim()
    if (!patientName) {
      toast.error("Enter a patient name")
      return
    }
    if (!formData.title.trim() && !formData.notes.trim()) {
      toast.error("Add a note title or clinical note content")
      return
    }

    setLoading(true)
    try {
      const medicines = formData.prescribedMedicines
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean)
      const tests = formData.medicalTests
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const doctorName = user
        ? `Dr. ${user.firstName || ""} ${user.lastName || ""}`.trim().replace(/\s+/g, " ")
        : undefined

      const payload: any = {
        ...(selectedPatientId ? { patientId: selectedPatientId } : isEdit ? { patientId: null } : {}),
        patientName,
        ...(!isEdit && appointmentId ? { appointmentId } : {}),
        recordType: "CLINICAL_NOTE",
        title: formData.title.trim() || `Clinical note — ${patientName}`,
        visitDate: formData.visitDate,
        recordDate: formData.visitDate,
        doctorName,
        diagnosis: formData.diagnosis || undefined,
        symptoms: formData.symptoms || undefined,
        notes: formData.notes || undefined,
        vitalSigns: {
          bloodPressure: formData.bloodPressure || undefined,
          heartRate: formData.heartRate ? parseInt(formData.heartRate, 10) : undefined,
          temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          height: formData.height ? parseFloat(formData.height) : undefined,
        },
        bloodGroup: formData.bloodGroup || undefined,
        prescribedMedicines: medicines,
        medicalTests: tests,
      }

      if (isEdit && editingId) {
        await apiService.put(`/medical-records/${editingId}`, payload)
        toast.success("Clinical note updated")
      } else {
        await apiService.post("/medical-records", payload)
        toast.success("Clinical note saved")
      }
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      console.error("Failed to save medical record:", error)
      toast.error(error?.response?.data?.message || error?.message || "Failed to save clinical note")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit clinical note" : "Clinical note"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "View and update this note, then save your changes."
              : "Halaxy-style note — type any patient name. Optionally link an existing patient or appointment."}
          </DialogDescription>
        </DialogHeader>

        {loadingRecord ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            Loading note…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {appointmentId && (
              <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Linked to appointment
                {prefill?.visitDate && !isEdit && (
                  <span className="text-muted-foreground">
                    · {format(new Date(prefill.visitDate), "MMM d, yyyy h:mm a")}
                  </span>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="patientName">Patient name *</Label>
                <Input
                  id="patientName"
                  placeholder="e.g. Priya Sharma"
                  value={formData.patientName}
                  onChange={(e) => {
                    setFormData({ ...formData, patientName: e.target.value })
                    if (selectedPatientId) setSelectedPatientId("")
                  }}
                  required
                />
              </div>

              {isDoctor && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Link existing patient (optional)</Label>
                  <Select
                    value={selectedPatientId || "__manual__"}
                    onValueChange={handleSelectDoctorPatient}
                    disabled={patientsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={patientsLoading ? "Loading..." : "Manual name only"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__manual__">Manual name only</SelectItem>
                      {doctorPatients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName}
                          {patient.phone ? ` · ${patient.phone}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="visitDate">Note date *</Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Note title *</Label>
                <Input
                  id="title"
                  placeholder="Consultation / follow-up / progress note"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Clinical note *</Label>
              <Textarea
                id="notes"
                placeholder="Write the clinical note here…"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={8}
                className="min-h-[160px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input
                id="diagnosis"
                placeholder="Optional diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              />
            </div>

            <Collapsible open={showExtras} onOpenChange={setShowExtras}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full justify-between px-0">
                  <span className="text-sm font-medium">Vitals, medicines & tests</span>
                  {showExtras ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms</Label>
                  <Textarea
                    id="symptoms"
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Blood pressure</Label>
                    <Input
                      placeholder="120/80"
                      value={formData.bloodPressure}
                      onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Heart rate</Label>
                    <Input
                      type="number"
                      value={formData.heartRate}
                      onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Temperature (°F)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Blood group</Label>
                    <Select
                      value={formData.bloodGroup || undefined}
                      onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Prescribed medicines</Label>
                  <Textarea
                    placeholder="Comma-separated"
                    value={formData.prescribedMedicines}
                    onChange={(e) => setFormData({ ...formData, prescribedMedicines: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Medical tests</Label>
                  <Textarea
                    placeholder="Comma-separated"
                    value={formData.medicalTests}
                    onChange={(e) => setFormData({ ...formData, medicalTests: e.target.value })}
                    rows={2}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Save changes" : "Save note"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
