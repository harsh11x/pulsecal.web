"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import { Loader2 } from "lucide-react"

interface AddInsuranceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function AddInsuranceDialog({ open, onOpenChange, onSuccess }: AddInsuranceDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        providerName: "",
        policyNumber: "",
        groupNumber: "",
        coverageStartDate: "",
        coverageEndDate: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await apiService.post("/api/v1/patients/insurance", {
                ...formData,
                isActive: true
            })

            toast.success("Insurance details added successfully!")
            onSuccess()
            onOpenChange(false)

            // Reset form
            setFormData({
                providerName: "",
                policyNumber: "",
                groupNumber: "",
                coverageStartDate: "",
                coverageEndDate: ""
            })
        } catch (error: any) {
            console.error("Failed to add insurance:", error)
            toast.error(error?.response?.data?.message || "Failed to add insurance details")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Insurance Information</DialogTitle>
                    <DialogDescription>
                        Enter your health insurance details to streamline billing and coverage verification.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="providerName">Insurance Provider *</Label>
                        <Input
                            id="providerName"
                            placeholder="e.g., Blue Cross Blue Shield"
                            value={formData.providerName}
                            onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="policyNumber">Policy Number *</Label>
                        <Input
                            id="policyNumber"
                            placeholder="Enter your policy number"
                            value={formData.policyNumber}
                            onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="groupNumber">Group Number</Label>
                        <Input
                            id="groupNumber"
                            placeholder="Enter group number (optional)"
                            value={formData.groupNumber}
                            onChange={(e) => setFormData({ ...formData, groupNumber: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="coverageStartDate">Coverage Start Date</Label>
                            <Input
                                id="coverageStartDate"
                                type="date"
                                value={formData.coverageStartDate}
                                onChange={(e) => setFormData({ ...formData, coverageStartDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coverageEndDate">Coverage End Date</Label>
                            <Input
                                id="coverageEndDate"
                                type="date"
                                value={formData.coverageEndDate}
                                onChange={(e) => setFormData({ ...formData, coverageEndDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Insurance
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
