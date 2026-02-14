"use client"

import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, RefreshCw, TrendingUp, IndianRupee, Calendar, ShieldX } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { apiService } from "@/services/api"
import { useAppSelector } from "@/app/hooks"
import { toast } from "sonner"
import { format } from "date-fns"
import { PLANS, PLAN_AMOUNTS, PLAN_FEATURES, PLAN_ORDER, SUBSCRIPTION_DURATIONS } from "@/lib/planConfig"

export default function SubscriptionPage() {
    const { user } = useAppSelector((state) => state.auth)
    const [loading, setLoading] = useState(true)
    const [currentSubscription, setCurrentSubscription] = useState<{
        plan: string
        status: string
        expiresAt: string | null
        lastPaymentAmount: number | null
        lastPaymentDate: string | null
    } | null>(null)
    const [processing, setProcessing] = useState<string | null>(null)
    const [billingInterval, setBillingInterval] = useState<1 | 3 | 6 | 12>(1)

    const planFeaturesMap = PLAN_FEATURES
    const plans = PLANS.map((p) => ({ ...p, price: `${p.price}`, amount: p.amount, period: "/month" }))
    const planOrder = PLAN_ORDER
    const currentPlanIndex = planOrder.indexOf((currentSubscription?.plan || "BASIC") as any)

    useEffect(() => {
        fetchSubscriptionStatus()
    }, [])

    const fetchSubscriptionStatus = async () => {
        try {
            const data: any = await apiService.get("/payments/subscription/status")
            setCurrentSubscription({
                plan: data?.plan || "BASIC",
                status: data?.status || "PENDING",
                expiresAt: data?.expiresAt || null,
                lastPaymentAmount: data?.lastPaymentAmount ?? null,
                lastPaymentDate: data?.lastPaymentDate || null,
            })
        } catch (error) {
            console.error("Failed to fetch subscription", error)
            setCurrentSubscription({
                plan: "BASIC",
                status: "PENDING",
                expiresAt: null,
                lastPaymentAmount: null,
                lastPaymentDate: null,
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSubscribe = async (planId: string, action: "renew" | "upgrade" | "downgrade" = "upgrade") => {
        setProcessing(planId)
        try {
            const data: any = await apiService.post("/payments/subscription/create", {
                planId,
                duration: billingInterval
            })
            const { orderId, key, amount } = data ?? {}
            if (!orderId || !key) {
                toast.error("Invalid response from server. Please try again.")
                setProcessing(null)
                return
            }

            if (!(window as any).Razorpay) {
                toast.error("Payment gateway not loaded. Please refresh the page.")
                setProcessing(null)
                return
            }

            const options = {
                key,
                amount: amount ?? (PLAN_AMOUNTS[planId] ?? 1) * 100 * billingInterval,
                currency: "INR",
                order_id: orderId,
                name: "PulseCal",
                description: `${planId} Subscription (${billingInterval} month${billingInterval > 1 ? 's' : ''})`,
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
        if (!confirm("Are you sure you want to cancel your subscription? You will revert to the Basic plan.")) return

        setProcessing("CANCEL")
        try {
            await apiService.post("/payments/subscription/cancel", {})
            toast.success("Subscription cancelled successfully")
            await fetchSubscriptionStatus()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to cancel subscription")
        } finally {
            setProcessing(null)
        }
    }

    const getPlanButtonLabel = (plan: { id: string; name: string }) => {
        const isCurrent = currentSubscription?.plan === plan.id && currentSubscription?.status === "ACTIVE"
        const planIdx = planOrder.indexOf(plan.id as any)
        const isHigher = planIdx > currentPlanIndex

        if (isCurrent) return "Extend Plan" // Changed from "Current Plan" to allow extension
        if (isHigher) return "Upgrade"
        if (planIdx < currentPlanIndex) return "Change Plan"
        return "Renew"
    }

    const isExpired = currentSubscription?.expiresAt && new Date(currentSubscription.expiresAt) < new Date()
    const expiresWithinWeek = currentSubscription?.expiresAt && new Date(currentSubscription.expiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const canRenew = currentSubscription?.status === "EXPIRED" || isExpired || (currentSubscription?.status === "ACTIVE" && expiresWithinWeek)

    // Only clinic creator (head doctor) or solo doctor can manage subscription
    if (user?.role?.toLowerCase() === "doctor" && (user as any)?.canManageSubscription !== true) {
        return (
            <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
                    <ShieldX className="h-16 w-16 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Access Restricted</h2>
                    <p className="text-muted-foreground max-w-md">
                        Only the clinic creator (head doctor) can manage the subscription. Please contact your clinic owner for plan changes.
                    </p>
                    <Button asChild variant="outline">
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            </ProtectedRoute>
        )
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
                    <p className="text-muted-foreground">Manage your clinic&apos;s subscription plan</p>
                </div>

                {/* Current Plan Status */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl">Your Plan: {plans.find(p => p.id === currentSubscription?.plan)?.name || currentSubscription?.plan || "Basic"}</CardTitle>
                                <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                                    <span>Status: <Badge variant={currentSubscription?.status === 'ACTIVE' && !isExpired ? 'default' : (currentSubscription?.status === 'EXPIRED' || isExpired) ? 'destructive' : 'secondary'} className="ml-1">{isExpired ? "EXPIRED" : (currentSubscription?.status || "PENDING")}</Badge></span>
                                    {currentSubscription?.expiresAt && (
                                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Expires: {format(new Date(currentSubscription.expiresAt), "MMM d, yyyy")}</span>
                                    )}
                                </CardDescription>
                            </div>
                            {(currentSubscription?.lastPaymentAmount != null || currentSubscription?.lastPaymentDate) && (
                                <div className="flex flex-col gap-1 text-sm">
                                    {currentSubscription?.lastPaymentAmount != null && (
                                        <div className="flex items-center gap-1.5">
                                            <IndianRupee className="h-4 w-4 text-primary" />
                                            <span className="font-semibold">₹{currentSubscription.lastPaymentAmount.toLocaleString()} paid</span>
                                        </div>
                                    )}
                                    {currentSubscription?.lastPaymentDate && (
                                        <span className="text-muted-foreground">on {format(new Date(currentSubscription.lastPaymentDate), "MMM d, yyyy")}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium mb-2">Plan Features:</p>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                            {(planFeaturesMap[currentSubscription?.plan || "BASIC"] || planFeaturesMap.BASIC).map((f, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2">
                        {currentSubscription?.status === 'ACTIVE' && (
                            <Button variant="destructive" onClick={handleCancel} disabled={!!processing}>
                                {processing === "CANCEL" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Cancel Subscription
                            </Button>
                        )}
                        {/* Allow extension at any time if plan is active */}
                        {currentSubscription?.plan && (
                            <Button
                                variant="outline"
                                onClick={() => handleSubscribe(currentSubscription.plan, "renew")}
                                disabled={!!processing}
                            >
                                {processing === currentSubscription.plan ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                {currentSubscription?.status === 'ACTIVE' && !canRenew ? "Extend Plan" : "Renew Plan"}
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                {/* Plan Cards */}
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl font-semibold">Available Plans</h2>

                        <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-1 rounded-full border border-border">
                            {SUBSCRIPTION_DURATIONS.map((duration) => (
                                <button
                                    key={duration.value}
                                    onClick={() => setBillingInterval(duration.value)}
                                    className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${billingInterval === duration.value
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {duration.label}
                                    {duration.discount > 0 && (
                                        <span className={`absolute -top-1.5 -right-1.5 text-[8px] bg-green-100 text-green-700 px-1 py-px rounded-full border border-green-200 font-bold ${billingInterval === duration.value ? "opacity-100" : "opacity-0"
                                            }`}>
                                            -{duration.discount}%
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {plans.map((plan) => {
                            const isCurrent = currentSubscription?.plan === plan.id && currentSubscription?.status === "ACTIVE"
                            const label = getPlanButtonLabel(plan)
                            const planIdx = planOrder.indexOf(plan.id)
                            const isUpgrade = planIdx > currentPlanIndex

                            // Calculate price based on interval
                            const baseAmount = PLAN_AMOUNTS[plan.id]
                            let multiplier: number = billingInterval
                            if (billingInterval === 12) multiplier = 10 // pay for 10 get 12

                            const totalAmount = baseAmount * multiplier
                            const priceDisplay = `Rs. ${totalAmount.toLocaleString("en-IN")}`

                            return (
                                <Card key={plan.id} className={`relative flex flex-col ${plan.recommended ? 'border-primary shadow-lg md:scale-105' : ''}`}>
                                    {plan.recommended && (
                                        <div className="absolute -top-3 left-0 right-0 flex justify-center">
                                            <Badge className="bg-primary text-primary-foreground"><TrendingUp className="h-3 w-3 mr-1" />Recommended</Badge>
                                        </div>
                                    )}
                                    {billingInterval > 1 && (
                                        <div className="absolute top-4 right-4 z-10">
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                {billingInterval === 12 ? "12 Months Autopay" : `${billingInterval} Months`}
                                            </Badge>
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle>{plan.name}</CardTitle>
                                        <CardDescription>{plan.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="mb-6">
                                            <span className="text-4xl font-bold">{priceDisplay}</span>
                                            <span className="text-muted-foreground"> / {SUBSCRIPTION_DURATIONS.find(d => d.value === billingInterval)?.label.toLowerCase().replace("months", "mo") || "month"}</span>
                                        </div>
                                        <ul className="space-y-3">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center text-sm text-muted-foreground">
                                                    <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full"
                                            variant={isUpgrade ? "default" : "outline"}
                                            onClick={() => handleSubscribe(plan.id, label === "Upgrade" ? "upgrade" : (label === "Renew" || label === "Extend Plan") ? "renew" : "downgrade")}
                                            disabled={!!processing} // Removed check for label === "Current Plan"
                                        >
                                            {processing === plan.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                label
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
