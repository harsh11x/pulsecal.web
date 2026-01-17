"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddPrescriptionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

interface Medicine {
    name: string
    dosage: string
    frequency: string
    duration: string
}

export function AddPrescriptionDialog({ open, onOpenChange, onSuccess }: AddPrescriptionDialogProps) {
    const [loading, setLoading] = useState(false)
    const [patients, setPatients] = useState<any[]>([])
    const [formData, setFormData] = useState({
        patientId: "",
        patientName: "", // For manual entry if needed or display
        date: new Date().toISOString().split('T')[0],
        notes: ""
    })

    const [medicines, setMedicines] = useState<Medicine[]>([
        { name: "", dosage: "", frequency: "", duration: "" }
    ])

    // Fetch patients for selection (if endpoint exists)
    useEffect(() => {
        if (open) {
            fetchPatients()
        }
    }, [open])

    const fetchPatients = async () => {
        try {
            // Try to fetch patients list if user is doctor
            // Using a generic users endpoint or appointments to get recent patients
            const response: any = await apiService.get("/api/v1/users?role=patient") // Adjust endpoint as needed
            setPatients(response.data || [])
        } catch (e) {
            console.warn("Failed to fetch patients list", e)
        }
    }

    const handleMedicineChange = (index: number, field: keyof Medicine, value: string) => {
        const newMedicines = [...medicines]
        newMedicines[index][field] = value
        setMedicines(newMedicines)
    }

    const addMedicine = () => {
        setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "" }])
    }

    const removeMedicine = (index: number) => {
        if (medicines.length > 1) {
            setMedicines(medicines.filter((_, i) => i !== index))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = {
                patientId: formData.patientId,
                date: formData.date,
                medicines: medicines.filter(m => m.name.trim() !== ""),
                notes: formData.notes
            }

            await apiService.post("/api/v1/prescriptions", payload)
            toast.success("Prescription added successfully")
            onSuccess()
            onOpenChange(false)
            // Reset form
            setFormData({
                patientId: "",
                patientName: "",
                date: new Date().toISOString().split('T')[0],
                notes: ""
            })
            setMedicines([{ name: "", dosage: "", frequency: "", duration: "" }])
        } catch (error: any) {
            console.error("Failed to add prescription:", error)
            toast.error(error.message || "Failed to add prescription")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Prescription</DialogTitle>
                    <DialogDescription>Create a digital prescription for your patient.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="patient">Patient</Label>
                            <Select
                                value={formData.patientId}
                                onValueChange={(val) => setFormData({ ...formData, patientId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Patient" />
                                </SelectTrigger>
                                <SelectContent>
                                    {patients.length > 0 ? (
                                        patients.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="manual">Enter Manually (Not supported yet)</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Medicines</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addMedicine}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Medicine
                            </Button>
                        </div>

                        {medicines.map((medicine, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-md bg-muted/10">
                                <div className="col-span-4 space-y-1">
                                    <Label className="text-xs">Medicine Name</Label>
                                    <Input
                                        placeholder="e.g. Paracetamol"
                                        value={medicine.name}
                                        onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Dosage</Label>
                                    <Input
                                        placeholder="500mg"
                                        value={medicine.dosage}
                                        onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-3 space-y-1">
                                    <Label className="text-xs">Frequency</Label>
                                    <Input
                                        placeholder="1-0-1"
                                        value={medicine.frequency}
                                        onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Duration</Label>
                                    <Input
                                        placeholder="5 days"
                                        value={medicine.duration}
                                        onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive"
                                        onClick={() => removeMedicine(index)}
                                        disabled={medicines.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Instructions / Notes</Label>
                        <Textarea
                            placeholder="Take after food..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading || !formData.patientId}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Prescription
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
