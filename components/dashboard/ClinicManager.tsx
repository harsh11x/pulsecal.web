"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Save, Loader2, MapPin } from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/services/api"
import { Clinic } from "@/types"

interface ClinicManagerProps {
    clinicId: string
}

export default function ClinicManager({ clinicId }: ClinicManagerProps) {
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        phone: "",
        email: "",
        website: "",
        description: ""
    })

    useEffect(() => {
        if (clinicId) {
            fetchClinicDetails()
        }
    }, [clinicId])

    const fetchClinicDetails = async () => {
        try {
            const response: any = await apiService.get(`/api/v1/clinics/${clinicId}`)
            const clinic = response.data || response

            if (clinic) {
                setFormData({
                    name: clinic.name || "",
                    address: clinic.address || "",
                    city: clinic.city || "",
                    state: clinic.state || "",
                    zipCode: clinic.zipCode || "",
                    country: clinic.country || "",
                    phone: clinic.phone || "",
                    email: clinic.email || "",
                    website: clinic.website || "",
                    description: clinic.description || ""
                })
            }
        } catch (error) {
            console.warn("Failed to fetch clinic details:", error)
            toast.error("Failed to load clinic details")
        } finally {
            setFetching(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!clinicId) {
            toast.error("Clinic ID is missing")
            return
        }
        setLoading(true)

        try {
            console.log("Updating clinic details:", formData)
            const response = await apiService.put(`/api/v1/clinics/${clinicId}`, formData)
            console.log("Update response:", response)
            toast.success("Clinic details updated successfully")
        } catch (error: any) {
            console.error("Failed to update clinic:", error)
            const errorMessage = error.response?.data?.message || error.message || "Failed to update clinic details"
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
                <CardTitle>Clinic Information</CardTitle>
                <CardDescription>Manage your clinic's public details and contact information</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Clinic Name</Label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="name"
                                className="pl-9"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="address"
                                className="pl-9"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                                id="state"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="zipCode">Zip Code</Label>
                            <Input
                                id="zipCode"
                                value={formData.zipCode}
                                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                                id="country"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Update Information
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
