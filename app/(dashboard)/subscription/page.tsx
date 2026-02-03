
"use client"

import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { useAppSelector } from "@/app/hooks"
import { toast } from "sonner"

export default function SubscriptionPage() {
    const { user } = useAppSelector((state) => state.auth)
    const [loading, setLoading] = useState(true)
    const [currentSubscription, setCurrentSubscription] = useState<any>(null)
    const [processing, setProcessing] = useState<string | null>(null)

    const planFeaturesMap: Record<string, string[]> = {
        STARTER: ["Up to 3 Doctors", "1,000 Appointments/month", "Basic Prescriptions", "Medical Records", "Custom Branding", "Email Support", "Mobile App Access"],
        BASIC: ["Up to 5 Doctors", "2,000 Appointments/month", "Full Prescriptions", "Medical Records", "Basic Analytics", "Email Support", "Mobile App Access"],
        PROFESSIONAL: ["Up to 10 Doctors", "Unlimited Appointments", "Receptionist Access", "Queue Management", "Full Prescriptions", "Medical Records", "Full Analytics", "Custom Branding", "Email Support", "Mobile App Access"],
        ENTERPRISE: ["Unlimited Doctors", "Unlimited Appointments", "Receptionist Access", "Queue Management", "Full Prescriptions", "Medical Records", "Export Analytics", "Custom Branding", "Email Support", "Mobile App Access"]
    }

    const plans = [
        { id: "STARTER", name: "Starter", price: "₹999", period: "/month", description: "Perfect for individual practitioners starting out.", features: planFeaturesMap.STARTER, recommended: false },
        { id: "BASIC", name: "Basic", price: "₹1,499", period: "/month", description: "For small practices.", features: planFeaturesMap.BASIC, recommended: false },
        { id: "PROFESSIONAL", name: "Professional", price: "₹2,999", period: "/month", description: "Ideal for growing clinics with multiple staff.", features: planFeaturesMap.PROFESSIONAL, recommended: true },
        { id: "ENTERPRISE", name: "Enterprise", price: "₹9,999", period: "/month", description: "For large hospitals and multi-location chains.", features: planFeaturesMap.ENTERPRISE, recommended: false }
    ]

    useEffect(() => {
        fetchSubscriptionStatus()
    }, [])

    const fetchSubscriptionStatus = async () => {
        try {
            // Use auth profile endpoint which returns doctor profile with subscription info
            const response: any = await apiService.get("/auth/profile")
            // apiService unwraps the response, so access fields directly
            const doctorProfile = response.doctorProfile
            
            setCurrentSubscription({
                plan: doctorProfile?.subscriptionPlan || response.subscriptionPlan || "STARTER",
                status: doctorProfile?.subscriptionStatus || response.subscriptionStatus || "PENDING",
                expiresAt: doctorProfile?.subscriptionExpiresAt || response.subscriptionExpiresAt
            })
        } catch (error) {
            console.error("Failed to fetch subscription", error)
            // Set default subscription state on error
            setCurrentSubscription({
                plan: "STARTER",
                status: "PENDING",
                expiresAt: null
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSubscribe = async (planId: string) => {
        setProcessing(planId)
        try {
            // 1. Create Subscription on Backend
            const response: any = await apiService.post("/payments/subscription/create", {
                planId: planId
            })

            const { subscriptionId, key_id } = response.data

            // 2. Open Razorpay Checkout
            const options = {
                key: key_id,
                subscription_id: subscriptionId,
                name: "PulseCal",
                description: `${planId} Subscription`,
                handler: async (response: any) => {
                    // 3. Verify Payment
                    try {
                        await apiService.post("/payments/subscription/verify", {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_signature: response.razorpay_signature
                        })
                        toast.success("Subscription activated successfully!")
                        fetchSubscriptionStatus()
                    } catch (verifyError) {
                        toast.error("Payment verification failed")
                    }
                },
                theme: {
                    color: "#0F172A"
                }
            }

            const rzp = new (window as any).Razorpay(options)
            rzp.open()

        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to initiate subscription")
        } finally {
            setProcessing(null)
        }
    }

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel your subscription? You will lose access to premium features at the end of the billing cycle.")) return;

        setProcessing("CANCEL")
        try {
            await apiService.post("/payments/subscription/cancel", {})
            toast.success("Subscription cancelled successfully")
            fetchSubscriptionStatus()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to cancel subscription")
        } finally {
            setProcessing(null)
        }
    }

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                <div className="flex h-96 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
            <div className="space-y-8 pb-10">
                <div>
                    <h1 className="text-3xl font-bold">Subscription & Billing</h1>
                    <p className="text-muted-foreground">Manage your clinic's subscription plan</p>
                </div>

                {/* Current Plan Status */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-xl">Your Plan: {currentSubscription?.plan || "Starter"}</CardTitle>
                        <CardDescription>
                            Status: <Badge variant={currentSubscription?.status === 'ACTIVE' ? 'default' : 'destructive'} className="ml-2">{currentSubscription?.status || "PENDING"}</Badge>
                            {currentSubscription?.expiresAt && (
                                <span className="ml-2">• Expires: {new Date(currentSubscription.expiresAt).toLocaleDateString()}</span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium mb-2">Plan Features:</p>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                            {(planFeaturesMap[currentSubscription?.plan || "STARTER"] || planFeaturesMap.STARTER).map((f, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {currentSubscription?.status === 'ACTIVE' && (
                            <Button variant="destructive" onClick={handleCancel} disabled={!!processing}>
                                {processing === "CANCEL" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Cancel Subscription
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                <div className="grid gap-8 md:grid-cols-3">
                    {plans.map((plan) => (
                        <Card key={plan.id} className={`relative flex flex-col ${plan.recommended ? 'border-primary shadow-lg scale-105' : ''}`}>
                            {plan.recommended && (
                                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                    <Badge className="bg-primary text-primary-foreground">Recommended</Badge>
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle>{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="mb-6">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-muted-foreground">{plan.period}</span>
                                </div>
                                <ul className="space-y-3">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center text-sm text-muted-foreground">
                                            <Check className="mr-2 h-4 w-4 text-green-500" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={plan.recommended ? "default" : "outline"}
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={!!processing || (currentSubscription?.plan === plan.id && currentSubscription?.status === 'ACTIVE')}
                                >
                                    {processing === plan.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (currentSubscription?.plan === plan.id && currentSubscription?.status === 'ACTIVE') ? (
                                        "Current Plan"
                                    ) : (
                                        "Upgrade"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </ProtectedRoute>
    )
}
