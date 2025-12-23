"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import { Loader2 } from "lucide-react"

interface AddMedicalRecordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function AddMedicalRecordDialog({ open, onOpenChange, onSuccess }: AddMedicalRecordDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
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

            await apiService.post("/api/v1/patients/medical-records", {
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
            })

            toast.success("Medical record added successfully!")
            onSuccess()
            onOpenChange(false)

            // Reset form
            setFormData({
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
        } catch (error: any) {
            console.error("Failed to add medical record:", error)
            toast.error(error?.response?.data?.message || "Failed to add medical record")
        } finally {
            setLoading(false)
        }
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
                    {/* Basic Information */}
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
