"use client"

import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, RefreshCw, TrendingUp, IndianRupee, Calendar, ShieldX, Zap, CircleSlash } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { apiService } from "@/services/api"
import { useAppSelector } from "@/app/hooks"
import { toast } from "sonner"
import { format } from "date-fns"
import { PLANS, PLAN_AMOUNTS, PLAN_YEARLY_AMOUNTS, PLAN_FEATURES, PLAN_ORDER } from "@/lib/planConfig"

export default function SubscriptionPage() {
    const { user } = useAppSelector((state) => state.auth)
    const [loading, setLoading] = useState(true)
    const [currentSubscription, setCurrentSubscription] = useState<{
        plan: string
        status: string
        expiresAt: string | null
        autoRenew: boolean
        nextBillingDate: string | null
        lastPaymentAmount: number | null
        lastPaymentDate: string | null
    } | null>(null)
    const [processing, setProcessing] = useState<string | null>(null)
    const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY")

    const planFeaturesMap = PLAN_FEATURES
    const plans = PLANS.map((p) => ({ ...p, price: `${p.price}`, amount: p.amount, period: "/month" }))
    const planOrder = PLAN_ORDER
    const normalizedCurrentPlan = currentSubscription?.plan === "STARTER" ? "BASIC" : (currentSubscription?.plan || "BASIC")
    const currentPlanIndex = planOrder.indexOf(normalizedCurrentPlan as any)

    useEffect(() => {
        fetchSubscriptionStatus()
    }, [])

    const fetchSubscriptionStatus = async () => {
        try {
            const data: any = await apiService.get("/payments/subscription/status")
            setCurrentSubscription({
                plan: data?.plan === "STARTER" ? "BASIC" : (data?.plan || "BASIC"),
                status: data?.status || "PENDING",
                expiresAt: data?.expiresAt || null,
                autoRenew: data?.autoRenew === true,
                nextBillingDate: data?.nextBillingDate || null,
                lastPaymentAmount: data?.lastPaymentAmount ?? null,
                lastPaymentDate: data?.lastPaymentDate || null,
            })
        } catch (error) {
            console.error("Failed to fetch subscription", error)
            setCurrentSubscription({
                plan: "BASIC",
                status: "PENDING",
                expiresAt: null,
                autoRenew: false,
                nextBillingDate: null,
                lastPaymentAmount: null,
                lastPaymentDate: null,
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSubscribe = async (planId: string, cycle: "MONTHLY" | "YEARLY" = billingCycle) => {
        setProcessing(planId)
        try {
            const payablePlanId = planId === "STARTER" ? "BASIC" : planId
            const billingCycle = cycle

            // Use the auto-debit subscription flow first (Razorpay charges the same
            // calendar day each month). Falls back to a one-time order server-side.
            // Yearly billing is always a one-time upfront order (12 months at 20% off).
            const data: any = await apiService.post("/payments/create-subscription", {
                plan: payablePlanId,
                billingCycle,
            })
            const isSubscriptionCheckout = data?.mode === "subscription" || Boolean(data?.subscriptionId)

            if (!data?.key || (!data?.subscriptionId && !data?.orderId)) {
                toast.error("Invalid response from server. Please try again.")
                setProcessing(null)
                return
            }

            if (!(window as any).Razorpay) {
                toast.error("Payment gateway not loaded. Please refresh the page.")
                setProcessing(null)
                return
            }

            const options: Record<string, unknown> = {
                key: data.key,
                currency: "INR",
                name: "PulseCal",
                description: isSubscriptionCheckout
                    ? `${payablePlanId} monthly auto-payment subscription`
                    : billingCycle === "YEARLY"
                        ? `${payablePlanId} yearly plan (12 months, 20% off)`
                        : `${payablePlanId} plan (1 month)`,
                handler: async (rzpResponse: any) => {
                    try {
                        if (isSubscriptionCheckout) {
                            await apiService.post("/payments/verify-subscription", {
                                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                                razorpay_subscription_id: rzpResponse.razorpay_subscription_id,
                                razorpay_signature: rzpResponse.razorpay_signature,
                                plan: payablePlanId,
                            })
                            toast.success("Subscription activated! Auto-pay will charge on the same day each month.")
                        } else {
                            await apiService.post("/payments/subscription/verify", {
                                razorpay_order_id: rzpResponse.razorpay_order_id,
                                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                                razorpay_signature: rzpResponse.razorpay_signature,
                            })
                            toast.success(
                                billingCycle === "YEARLY"
                                    ? "Yearly subscription activated! Access for 12 months."
                                    : "Subscription renewed successfully!"
                            )
                        }
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

            if (isSubscriptionCheckout) {
                options.subscription_id = data.subscriptionId
            } else {
                options.order_id = data.orderId
                options.amount = data.amount
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
        if (!confirm("Are you sure you want to cancel auto-pay? Your plan stays active until the end of the current billing period, then expires.")) return

        setProcessing("CANCEL")
        try {
            await apiService.post("/payments/subscription/cancel", {})
            toast.success("Auto-pay cancelled. No further charges will be made.")
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

        if (isCurrent) return "Extend Plan"
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
                    <p className="text-muted-foreground">Manage your clinic&apos;s monthly subscription billing</p>
                </div>

                {/* Current Plan Status */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl">Your Plan: {plans.find(p => p.id === normalizedCurrentPlan)?.name || normalizedCurrentPlan || "Basic"}</CardTitle>
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
                        {/* Auto-pay banner */}
                        {currentSubscription?.autoRenew ? (
                            <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 mb-4">
                                <Zap className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-green-700">Auto-pay is ON</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {currentSubscription.nextBillingDate
                                            ? <>Your next charge of <span className="font-medium">₹{PLAN_AMOUNTS[normalizedCurrentPlan]?.toLocaleString("en-IN")}</span> will be on <span className="font-medium">{format(new Date(currentSubscription.nextBillingDate), "MMM d, yyyy")}</span>.</>
                                            : "You will be charged on the same calendar day each month automatically."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
                                <CircleSlash className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-700">Auto-pay is OFF</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        Your plan will not renew automatically. Renew manually to avoid interruption.
                                    </p>
                                </div>
                            </div>
                        )}

                        <p className="text-sm font-medium mb-2">Plan Features:</p>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                            {(planFeaturesMap[normalizedCurrentPlan] || planFeaturesMap.BASIC).map((f, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2">
                        {(currentSubscription?.status === 'ACTIVE' || currentSubscription?.autoRenew) && (
                            <Button variant="destructive" onClick={handleCancel} disabled={!!processing}>
                                {processing === "CANCEL" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Cancel Auto-pay
                            </Button>
                        )}
                        {currentSubscription?.plan && !currentSubscription?.autoRenew && (
                            <Button
                                variant="outline"
                                onClick={() => handleSubscribe(currentSubscription.plan, "MONTHLY")}
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
                        <Badge variant="outline">Secure Razorpay checkout</Badge>
                    </div>

                    <div className="flex items-center justify-center gap-2 bg-muted/30 p-1.5 rounded-full w-fit mx-auto mb-8 border border-border">
                        <button
                            onClick={() => setBillingCycle("MONTHLY")}
                            className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${billingCycle === "MONTHLY" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle("YEARLY")}
                            className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${billingCycle === "YEARLY" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Yearly
                            <span className="absolute -top-2 -right-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full border border-green-200 font-bold">
                                -20%
                            </span>
                        </button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {plans.map((plan) => {
                            const isCurrent = currentSubscription?.plan === plan.id && currentSubscription?.status === "ACTIVE"
                            const label = getPlanButtonLabel(plan)
                            const planIdx = planOrder.indexOf(plan.id)
                            const isUpgrade = planIdx > currentPlanIndex

                            const isYearly = billingCycle === "YEARLY"
                            const amount = isYearly ? PLAN_YEARLY_AMOUNTS[plan.id] : PLAN_AMOUNTS[plan.id]
                            const priceDisplay = `₹${amount.toLocaleString("en-IN")}`

                            return (
                                <Card key={plan.id} className={`relative flex flex-col ${plan.recommended ? 'border-primary shadow-lg md:scale-105' : ''}`}>
                                    {plan.recommended && (
                                        <div className="absolute -top-3 left-0 right-0 flex justify-center">
                                            <Badge className="bg-primary text-primary-foreground"><TrendingUp className="h-3 w-3 mr-1" />Recommended</Badge>
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle>{plan.name}</CardTitle>
                                        <CardDescription>{plan.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="mb-6">
                                            <span className="text-4xl font-bold">{priceDisplay}</span>
                                            <span className="text-muted-foreground">{isYearly ? " / year" : " / month"}</span>
                                            {isYearly && (
                                                <div className="text-xs text-green-600 font-semibold mt-1">Save 20% vs monthly</div>
                                            )}
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
                                            onClick={() => handleSubscribe(plan.id)}
                                            disabled={!!processing || (isCurrent && currentSubscription?.autoRenew)}
                                            title={isCurrent && currentSubscription?.autoRenew ? "Auto-pay already active for this plan" : undefined}
                                        >
                                            {processing === plan.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : isCurrent && currentSubscription?.autoRenew ? (
                                                "Active"
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
