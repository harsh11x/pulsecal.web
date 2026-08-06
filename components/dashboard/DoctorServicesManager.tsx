"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Save, Loader2, IndianRupee } from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/services/api"

interface DoctorServicesManagerProps {
    userId: string
}

export default function DoctorServicesManager({ userId }: DoctorServicesManagerProps) {
    const [loading, setLoading] = useState(false)
    const [services, setServices] = useState<string[]>([])
    const [newService, setNewService] = useState("")
    const [consultationFee, setConsultationFee] = useState<number>(0)
    const [fetching, setFetching] = useState(true)

    useEffect(() => {
        fetchDoctorProfile()
    }, [userId])

    const fetchDoctorProfile = async () => {
        try {
            const response: any = await apiService.get(`/doctor-profiles/me`)
            // unwrapResponse already returns data; tolerate nested shapes just in case
            const profile = (response?.data && typeof response.data === "object" && !Array.isArray(response.data))
                ? response.data
                : response

            if (profile) {
                const loaded = Array.isArray(profile.services)
                    ? profile.services.filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
                    : []
                setServices(loaded)
                const fee = Number(profile.consultationFee)
                setConsultationFee(Number.isFinite(fee) ? fee : 0)
            }
        } catch (error) {
            console.warn("Failed to fetch doctor services:", error)
            toast.error("Failed to load services")
        } finally {
            setFetching(false)
        }
    }

    const handleAddService = () => {
        const trimmed = newService.trim()
        if (!trimmed) return
        if (services.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
            toast.error("Service already exists")
            return
        }
        setServices((prev) => [...prev, trimmed])
        setNewService("")
    }

    const handleRemoveService = (serviceToRemove: string) => {
        setServices(services.filter(s => s !== serviceToRemove))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            console.log("Saving services:", { services, consultationFee })
            const response = await apiService.put("/doctor-profiles/me", {
                services,
                consultationFee
            })
            console.log("Save response:", response)
            toast.success("Services and fees updated successfully")
        } catch (error: any) {
            console.error("Failed to save services:", error)
            // Show detailed error if available
            const errorMessage = error.response?.data?.message || error.message || "Failed to save changes"
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Services & Fees</CardTitle>
                <CardDescription>Manage the medical services you offer and your consultation fee</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="space-y-2">
                    <Label htmlFor="fee">General Consultation Fee</Label>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="fee"
                            type="number"
                            className="pl-9"
                            value={consultationFee}
                            onChange={(e) => setConsultationFee(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">This fee will be shown to patients when booking an appointment.</p>
                </div>

                <div className="space-y-3">
                    <Label>Services Offered</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add a service (e.g., General Checkup, Vaccination)"
                            value={newService}
                            onChange={(e) => setNewService(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddService()
                                }
                            }}
                        />
                        <Button onClick={handleAddService} type="button" size="icon">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4 min-h-[100px] border rounded-md p-4 bg-muted/30">
                        {services.length === 0 && (
                            <p className="text-sm text-muted-foreground w-full text-center py-8">No services added yet.</p>
                        )}
                        {services.map((service) => (
                            <Badge
                                key={service}
                                variant="outline"
                                className="gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground bg-card border-border shadow-sm overflow-visible"
                            >
                                <span>{service}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveService(service)}
                                    aria-label={`Remove ${service}`}
                                    className="inline-flex items-center justify-center rounded-sm text-muted-foreground hover:bg-destructive hover:text-destructive-foreground p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>

                <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
