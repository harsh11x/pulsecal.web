
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
            // Try auth profile first, then doctor-profiles/me for subscription info
            let plan = "STARTER", status = "PENDING", expiresAt = null
            try {
                const response: any = await apiService.get("/auth/profile")
                const dp = response?.doctorProfile
                plan = dp?.subscriptionPlan || response?.subscriptionPlan || plan
                status = dp?.subscriptionStatus || response?.subscriptionStatus || status
                expiresAt = dp?.subscriptionExpiresAt || response?.subscriptionExpiresAt
            } catch {
                try {
                    const profile: any = await apiService.get("/doctor-profiles/me")
                    plan = profile?.subscriptionPlan || plan
                    status = profile?.subscriptionStatus || status
                    expiresAt = profile?.subscriptionExpiresAt
                } catch { /* use defaults */ }
            }
            setCurrentSubscription({ plan, status, expiresAt })
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

    const PLAN_AMOUNTS: Record<string, number> = {
        STARTER: 999,
        BASIC: 1499,
        PROFESSIONAL: 2999,
        ENTERPRISE: 9999
    }

    const handleSubscribe = async (planId: string) => {
        setProcessing(planId)
        try {
            const data: any = await apiService.post("/payments/subscription/create", { planId })
            const { orderId, key, amount } = data ?? {}
            if (!orderId || !key) {
                toast.error("Invalid response from server")
                return
            }

            if (!(window as any).Razorpay) {
                toast.error("Payment gateway not loaded. Please refresh the page.")
                return
            }

            const options = {
                key,
                amount: amount ?? (PLAN_AMOUNTS[planId] ?? 999) * 100,
                currency: "INR",
                order_id: orderId,
                name: "PulseCal",
                description: `${planId} Subscription (1 month)`,
                handler: async (rzpResponse: any) => {
                    try {
                        await apiService.post("/payments/subscription/verify", {
                            razorpay_order_id: rzpResponse.razorpay_order_id,
                            razorpay_payment_id: rzpResponse.razorpay_payment_id,
                            razorpay_signature: rzpResponse.razorpay_signature
                        })
                        toast.success("Subscription activated successfully!")
                        await fetchSubscriptionStatus()
                    } catch (verifyError: any) {
                        toast.error(verifyError.response?.data?.message || "Payment verification failed")
                    } finally {
                        setProcessing(null)
                    }
                },
                modal: { ondismiss: () => setProcessing(null) },
                theme: { color: "#0F172A" }
            }

            const rzp = new (window as any).Razorpay(options)
            rzp.on("payment.failed", () => {
                toast.error("Payment failed. Please try again.")
                setProcessing(null)
            })
            rzp.open()
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || "Failed to initiate subscription"
            toast.error(msg)
            setProcessing(null)
        }
    }

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel your subscription? You will revert to the Starter plan.")) return

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
