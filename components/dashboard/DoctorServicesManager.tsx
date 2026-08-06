"use client"

import { useState, useEffect, type CSSProperties } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus, Save, Loader2, IndianRupee } from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import { medicalServices } from "@/lib/medicalData"

interface DoctorServicesManagerProps {
    userId: string
}

/** Hard-coded colors so theme tokens cannot hide the label text. */
const chipStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #94a3b8",
    backgroundColor: "#e2e8f0",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1.4,
    maxWidth: "100%",
}

const chipLabelStyle: CSSProperties = {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1.4,
    whiteSpace: "normal",
    wordBreak: "break-word",
}

const removeBtnStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "22px",
    height: "22px",
    borderRadius: "4px",
    border: "1px solid #64748b",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    cursor: "pointer",
    padding: 0,
}

function normalizeServices(raw: unknown): string[] {
    if (!Array.isArray(raw)) return []
    const seen = new Set<string>()
    const out: string[] = []
    for (const item of raw) {
        const value = typeof item === "string" ? item.trim() : String(item ?? "").trim()
        if (!value) continue
        const key = value.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(value)
    }
    return out
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
            const profile =
                response?.data && typeof response.data === "object" && !Array.isArray(response.data)
                    ? response.data
                    : response

            if (profile) {
                setServices(normalizeServices(profile.services))
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

    const addService = (value: string) => {
        const trimmed = value.trim()
        if (!trimmed) return
        if (services.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
            toast.error("Service already exists")
            return
        }
        setServices((prev) => [...prev, trimmed])
    }

    const handleAddService = () => {
        addService(newService)
        setNewService("")
    }

    const handleRemoveService = (serviceToRemove: string) => {
        setServices((prev) => prev.filter((s) => s !== serviceToRemove))
    }

    const handleToggleSuggested = (service: string) => {
        if (services.some((s) => s.toLowerCase() === service.toLowerCase())) {
            handleRemoveService(service)
        } else {
            addService(service)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const response: any = await apiService.put("/doctor-profiles/me", {
                services,
                consultationFee,
            })
            const saved =
                response?.data && typeof response.data === "object" && !Array.isArray(response.data)
                    ? response.data
                    : response
            if (saved) {
                setServices(normalizeServices(saved.services ?? services))
                const fee = Number(saved.consultationFee ?? consultationFee)
                if (Number.isFinite(fee)) setConsultationFee(fee)
            }
            toast.success("Services and fees updated successfully")
        } catch (error: any) {
            console.error("Failed to save services:", error)
            const errorMessage = error.response?.data?.message || error.message || "Failed to save changes"
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )
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
                    <p className="text-xs text-muted-foreground">
                        This fee will be shown to patients when booking an appointment.
                    </p>
                </div>

                <div className="space-y-3">
                    <Label>Services Offered</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add a service (e.g., General Checkup, Vaccination)"
                            value={newService}
                            onChange={(e) => setNewService(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleAddService()
                                }
                            }}
                        />
                        <Button onClick={handleAddService} type="button" size="icon" aria-label="Add service">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Quick add common services</p>
                        <div className="flex flex-wrap gap-2">
                            {medicalServices.slice(0, 12).map((service) => {
                                const selected = services.some((s) => s.toLowerCase() === service.toLowerCase())
                                return (
                                    <button
                                        key={service}
                                        type="button"
                                        onClick={() => handleToggleSuggested(service)}
                                        style={{
                                            ...chipStyle,
                                            backgroundColor: selected ? "#0f172a" : "#ffffff",
                                            color: selected ? "#ffffff" : "#0f172a",
                                            borderColor: selected ? "#0f172a" : "#94a3b8",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {service}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div
                        className="flex flex-wrap gap-2 mt-2 min-h-[100px] rounded-md p-4"
                        style={{ border: "1px solid #cbd5e1", backgroundColor: "#f8fafc" }}
                    >
                        {services.length === 0 ? (
                            <p className="w-full text-center py-8 text-sm" style={{ color: "#64748b" }}>
                                No services added yet. Type a service above or pick from quick add.
                            </p>
                        ) : (
                            services.map((service) => (
                                <span key={service} style={chipStyle} title={service}>
                                    <span style={chipLabelStyle}>{service}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveService(service)}
                                        aria-label={`Remove ${service}`}
                                        style={removeBtnStyle}
                                    >
                                        <X size={14} color="#0f172a" strokeWidth={2.5} />
                                    </button>
                                </span>
                            ))
                        )}
                    </div>
                    {services.length > 0 && (
                        <p className="text-xs" style={{ color: "#475569" }}>
                            {services.length} service{services.length === 1 ? "" : "s"} selected: {services.join(", ")}
                        </p>
                    )}
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
