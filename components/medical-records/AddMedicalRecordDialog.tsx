"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { CalendarDays, FileText, Loader2, Search, UserPlus, X } from "lucide-react"


interface AddMedicalRecordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function AddMedicalRecordDialog({ open, onOpenChange, onSuccess }: AddMedicalRecordDialogProps) {
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<any>(null)
    const searchRef = useRef<HTMLDivElement>(null)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const { user } = useAppSelector((state) => state.auth)
    const isDoctor = user?.role?.toLowerCase() === "doctor"
    const [doctorPatients, setDoctorPatients] = useState<any[]>([])
    const [patientsLoading, setPatientsLoading] = useState(false)
    const [patientsError, setPatientsError] = useState(false)

    const [formData, setFormData] = useState({
        patientFirstName: "",
        patientLastName: "",
        patientPhone: "",
        patientGender: "",
        patientAddress: "",
        visitDate: "",
        doctorName: "",
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
        notes: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Doctors can only add records for patients who came to them (selected from their own patient list)
        if (isDoctor && !selectedPatient) {
            toast.error("Please select a patient from the dropdown")
            return
        }

        setLoading(true)

        try {
            // Parse medicines and tests from comma-separated strings
            const medicines = formData.prescribedMedicines
                .split(',')
                .map(m => m.trim())
                .filter(m => m.length > 0)

            const tests = formData.medicalTests
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0)

            // Use patientId if an existing patient was selected, otherwise send patientDetails for new patient
            const payload: any = {
                ...(selectedPatient ? { patientId: selectedPatient.id } : {
                    patientDetails: {
                        firstName: formData.patientFirstName,
                        lastName: formData.patientLastName,
                        phone: formData.patientPhone,
                        gender: formData.patientGender || undefined,
                        address: formData.patientAddress || undefined,
                    },
                }),
                recordType: "CONSULTATION",
                title: formData.diagnosis || "Medical Record",
                visitDate: formData.visitDate,
                doctorName: formData.doctorName,
                diagnosis: formData.diagnosis,
                symptoms: formData.symptoms,
                vitalSigns: {
                    bloodPressure: formData.bloodPressure,
                    heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
                    temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
                    weight: formData.weight ? parseFloat(formData.weight) : undefined,
                    height: formData.height ? parseFloat(formData.height) : undefined
                },
                bloodGroup: formData.bloodGroup || undefined,
                prescribedMedicines: medicines,
                medicalTests: tests,
                notes: formData.notes
            }

            await apiService.post("/medical-records", payload)

            toast.success("Medical record added successfully!")
            onSuccess()
            onOpenChange(false)

            // Reset form
            setFormData({
                patientFirstName: "",
                patientLastName: "",
                patientPhone: "",
                patientGender: "",
                patientAddress: "",
                visitDate: "",
                doctorName: "",
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
                notes: ""
            })
            setSelectedPatient(null)
            setSearchQuery("")
            setSearchResults([])
        } catch (error: any) {
            console.error("Failed to add medical record:", error)
            toast.error(error?.response?.data?.message || "Failed to add medical record")
        } finally {
            setLoading(false)
        }
    }

    // Debounced patient search
    const searchPatients = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([])
            setShowResults(false)
            return
        }

        setIsSearching(true)
        try {
            const response: any = await apiService.get(`/users?role=patient&search=${encodeURIComponent(query)}&limit=10`)
            setSearchResults(response.data || [])
            setShowResults(true)
        } catch (error) {
            console.error("Failed to search patients:", error)
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }, [])

    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }
        searchTimeoutRef.current = setTimeout(() => {
            searchPatients(searchQuery)
        }, 300)
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [searchQuery, searchPatients])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Doctors: load their own patients (only these can be selected) when the dialog opens
    useEffect(() => {
        if (open && isDoctor) {
            const loadDoctorPatients = async () => {
                setPatientsLoading(true)
                setPatientsError(false)
                try {
                    const response: any = await apiService.get("/doctors/patients")
                    const patients = Array.isArray(response) ? response : (response?.patients || [])
                    setDoctorPatients(patients)
                    setSelectedPatient(null)
                    setSearchQuery("")
                } catch (error) {
                    console.error("Failed to load doctor's patients:", error)
                    setPatientsError(true)
                } finally {
                    setPatientsLoading(false)
                }
            }
            loadDoctorPatients()
        }
    }, [open, isDoctor])

    // Auto-fill the doctor's name from the logged-in user (no manual typing needed)
    useEffect(() => {
        if (open && isDoctor) {
            const doctorName = user
                ? `Dr. ${user.firstName || ""} ${user.lastName || ""}`.trim().replace(/\s+/g, " ")
                : ""
            setFormData((prev) => ({ ...prev, doctorName }))
        }
    }, [open, isDoctor, user])

    const handleSelectDoctorPatient = (patientId: string) => {
        const patient = doctorPatients.find((p) => p.id === patientId)
        if (patient) {
            setSelectedPatient(patient)
            setFormData({
                ...formData,
                patientFirstName: patient.firstName || "",
                patientLastName: patient.lastName || "",
                patientPhone: patient.phone || "",
            })
        }
    }

    const handleSelectPatient = (patient: any) => {
        setSelectedPatient(patient)
        setFormData({
            ...formData,
            patientFirstName: patient.firstName || "",
            patientLastName: patient.lastName || "",
            patientPhone: patient.phone || "",
        })
        setSearchQuery("")
        setShowResults(false)
    }

    const handleClearPatient = () => {
        setSelectedPatient(null)
        setFormData({
            ...formData,
            patientFirstName: "",
            patientLastName: "",
            patientPhone: "",
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Medical Record</DialogTitle>
                    <DialogDescription>
                        Enter comprehensive medical record details including diagnosis, vitals, and prescriptions.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Patient Information */}
                    <div className="border rounded-lg p-4 space-y-4">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Patient Information</h4>

                        {isDoctor ? (
                            <>
                                {/* Doctor: select from their own patients only */}
                                <div className="space-y-2">
                                    <Label htmlFor="doctorPatientSelect">Select Patient *</Label>
                                    <Select
                                        value={selectedPatient?.id || ""}
                                        onValueChange={handleSelectDoctorPatient}
                                        disabled={patientsLoading || doctorPatients.length === 0}
                                    >
                                        <SelectTrigger id="doctorPatientSelect">
                                            <SelectValue placeholder={patientsLoading ? "Loading patients..." : "Choose a patient..."} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {doctorPatients.map((patient) => (
                                                <SelectItem key={patient.id} value={patient.id} className="py-2 items-start">
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-medium">
                                                                {patient.firstName} {patient.lastName}
                                                            </span>
                                                            {patient.phone && (
                                                                <span className="text-xs text-muted-foreground">{patient.phone}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <CalendarDays className="h-3 w-3" />
                                                                {patient.appointmentCount ?? 0} visit{patient.appointmentCount === 1 ? "" : "s"}
                                                            </span>
                                                            {patient.lastVisitAt && (
                                                                <span>
                                                                    Last: {format(new Date(patient.lastVisitAt), "MMM d, yyyy")}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {patient.recentRecords?.length > 0 && (
                                                            <div className="flex flex-col gap-0.5 border-t border-border/60 pt-1 mt-0.5">
                                                                {patient.recentRecords.map((rec: any, i: number) => (
                                                                    <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                                                        <FileText className="h-3 w-3 shrink-0" />
                                                                        <span className="truncate">
                                                                            {rec.diagnosis || rec.title}
                                                                        </span>
                                                                        {rec.recordDate && (
                                                                            <span className="shrink-0">
                                                                                · {format(new Date(rec.recordDate), "MMM d")}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {patientsLoading && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Loading your patients...
                                        </p>
                                    )}
                                    {patientsError && (
                                        <p className="text-sm text-destructive">Failed to load patients. Please try again.</p>
                                    )}
                                    {!patientsLoading && !patientsError && doctorPatients.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            No patients have visited you yet. Patients who book an appointment with you will appear here.
                                        </p>
                                    )}
                                </div>

                                {/* Selected Patient Badge */}
                                {selectedPatient && (
                                    <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                            <span className="text-xs font-medium text-primary">
                                                {(selectedPatient.firstName?.[0] || "?").toUpperCase()}{(selectedPatient.lastName?.[0] || "").toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                                            {selectedPatient.email && (
                                                <div className="text-xs text-muted-foreground">{selectedPatient.email}</div>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                            onClick={handleClearPatient}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Patient Search */}
                                <div className="relative" ref={searchRef}>
                                    <Label htmlFor="patientSearch">Search Existing Patient</Label>
                            <div className="relative mt-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="patientSearch"
                                    placeholder="Type name or phone to search..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setSelectedPatient(null)
                                    }}
                                    onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowResults(true)}
                                    className="pl-9 pr-9"
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                                {!isSearching && searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery("")
                                            setSearchResults([])
                                            setShowResults(false)
                                            setSelectedPatient(null)
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {showResults && searchResults.length > 0 && (
                                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-60 overflow-auto">
                                    {searchResults.map((patient) => (
                                        <button
                                            key={patient.id}
                                            type="button"
                                            className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground outline-none transition-colors"
                                            onClick={() => handleSelectPatient(patient)}
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                <span className="text-xs font-medium text-primary">
                                                    {(patient.firstName?.[0] || "?").toUpperCase()}{(patient.lastName?.[0] || "").toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                                                {patient.email && (
                                                    <div className="text-xs text-muted-foreground">{patient.email}</div>
                                                )}
                                            </div>
                                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {showResults && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
                                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md p-3">
                                    <p className="text-sm text-muted-foreground">No patients found. Fill in details below to create a new patient.</p>
                                </div>
                            )}
                        </div>

                        {/* Selected Patient Badge */}
                        {selectedPatient && (
                            <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                    <span className="text-xs font-medium text-primary">
                                        {(selectedPatient.firstName?.[0] || "?").toUpperCase()}{(selectedPatient.lastName?.[0] || "").toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                                    {selectedPatient.email && (
                                        <div className="text-xs text-muted-foreground">{selectedPatient.email}</div>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={handleClearPatient}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="patientFirstName">Patient First Name *</Label>
                                <Input
                                    id="patientFirstName"
                                    placeholder="John"
                                    value={formData.patientFirstName}
                                    onChange={(e) => setFormData({ ...formData, patientFirstName: e.target.value })}
                                    readOnly={!!selectedPatient}
                                    className={selectedPatient ? "bg-muted/50 cursor-not-allowed" : ""}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="patientLastName">Patient Last Name</Label>
                                <Input
                                    id="patientLastName"
                                    placeholder="Doe"
                                    value={formData.patientLastName}
                                    onChange={(e) => setFormData({ ...formData, patientLastName: e.target.value })}
                                    readOnly={!!selectedPatient}
                                    className={selectedPatient ? "bg-muted/50 cursor-not-allowed" : ""}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="patientPhone">Patient Phone *</Label>
                                <Input
                                    id="patientPhone"
                                    placeholder="1234567890"
                                    value={formData.patientPhone}
                                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                                    readOnly={!!selectedPatient}
                                    className={selectedPatient ? "bg-muted/50 cursor-not-allowed" : ""}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="patientGender">Gender</Label>
                                <Select value={formData.patientGender} onValueChange={(value) => setFormData({ ...formData, patientGender: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="patientAddress">Address</Label>
                                <Input
                                    id="patientAddress"
                                    placeholder="123 Main St, City, State"
                                    value={formData.patientAddress}
                                    onChange={(e) => setFormData({ ...formData, patientAddress: e.target.value })}
                                />
                            </div>
                        </div>
                            </>
                        )}
                    </div>

                    {/* Visit Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="visitDate">Visit Date *</Label>
                            <Input
                                id="visitDate"
                                type="date"
                                value={formData.visitDate}
                                onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="doctorName">Doctor Name *</Label>
                            <Input
                                id="doctorName"
                                placeholder="Dr. John Smith"
                                value={formData.doctorName}
                                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                                readOnly={isDoctor}
                                className={isDoctor ? "bg-muted/50 cursor-not-allowed" : ""}
                                required
                            />
                        </div>
                    </div>

                    {/* Diagnosis and Symptoms */}
                    <div className="space-y-2">
                        <Label htmlFor="diagnosis">Diagnosis *</Label>
                        <Input
                            id="diagnosis"
                            placeholder="Primary diagnosis"
                            value={formData.diagnosis}
                            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="symptoms">Symptoms/Issues Faced *</Label>
                        <Textarea
                            id="symptoms"
                            placeholder="Describe the symptoms and issues the patient experienced..."
                            value={formData.symptoms}
                            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                            rows={3}
                            required
                        />
                    </div>

                    {/* Vital Signs */}
                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Vital Signs</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bloodPressure">Blood Pressure</Label>
                                <Input
                                    id="bloodPressure"
                                    placeholder="120/80"
                                    value={formData.bloodPressure}
                                    onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                                <Input
                                    id="heartRate"
                                    type="number"
                                    placeholder="72"
                                    value={formData.heartRate}
                                    onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="temperature">Temperature (°F)</Label>
                                <Input
                                    id="temperature"
                                    type="number"
                                    step="0.1"
                                    placeholder="98.6"
                                    value={formData.temperature}
                                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="weight">Weight (kg)</Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    step="0.1"
                                    placeholder="70"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="height">Height (cm)</Label>
                                <Input
                                    id="height"
                                    type="number"
                                    step="0.1"
                                    placeholder="170"
                                    value={formData.height}
                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bloodGroup">Blood Group</Label>
                                <Select value={formData.bloodGroup} onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A+">A+</SelectItem>
                                        <SelectItem value="A-">A-</SelectItem>
                                        <SelectItem value="B+">B+</SelectItem>
                                        <SelectItem value="B-">B-</SelectItem>
                                        <SelectItem value="AB+">AB+</SelectItem>
                                        <SelectItem value="AB-">AB-</SelectItem>
                                        <SelectItem value="O+">O+</SelectItem>
                                        <SelectItem value="O-">O-</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Prescriptions and Tests */}
                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Prescriptions & Tests</h4>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="prescribedMedicines">Prescribed Medicines</Label>
                                <Textarea
                                    id="prescribedMedicines"
                                    placeholder="Enter medicines separated by commas (e.g., Aspirin 100mg, Paracetamol 500mg)"
                                    value={formData.prescribedMedicines}
                                    onChange={(e) => setFormData({ ...formData, prescribedMedicines: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="medicalTests">Medical Tests</Label>
                                <Textarea
                                    id="medicalTests"
                                    placeholder="Enter tests separated by commas (e.g., Blood Test, X-Ray, ECG)"
                                    value={formData.medicalTests}
                                    onChange={(e) => setFormData({ ...formData, medicalTests: e.target.value })}
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Any additional observations or recommendations..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Record
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
