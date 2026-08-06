"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Calendar } from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/services/api"

const DEMO_FEE = 5

type ScheduleDemoButtonProps = {
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ScheduleDemoButton({
  className,
  variant = "outline",
  size = "lg",
}: ScheduleDemoButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    preferredSlot: "",
    message: "",
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    if ((window as any).Razorpay) return
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
  }, [])

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    const email = form.email.trim()
    const phone = form.phone.replace(/\D/g, "").slice(0, 10)

    if (name.length < 2) {
      toast.error("Please enter your full name")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email")
      return
    }
    if (phone.length !== 10) {
      toast.error("Phone must be exactly 10 digits")
      return
    }

    setLoading(true)
    try {
      const orderRes: any = await apiService.post("/payments/demo/create-order", {
        name,
        email,
        phone,
        organization: form.organization.trim() || undefined,
        preferredSlot: form.preferredSlot.trim() || undefined,
        message: form.message.trim() || undefined,
      })

      if (!(window as any).Razorpay) {
        toast.error("Payment gateway failed to load. Please refresh and try again.")
        setLoading(false)
        return
      }

      const options = {
        key: orderRes.key,
        amount: orderRes.amount,
        currency: orderRes.currency || "INR",
        name: "PulseCal",
        description: `Product demo (₹${DEMO_FEE})`,
        order_id: orderRes.orderId,
        prefill: {
          name,
          email,
          contact: phone,
        },
        handler: async (response: any) => {
          try {
            await apiService.post("/payments/demo/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success("Demo booked! We'll contact you shortly to confirm the time.")
            setOpen(false)
            setForm({
              name: "",
              email: "",
              phone: "",
              organization: "",
              preferredSlot: "",
              message: "",
            })
          } catch (err: any) {
            toast.error(err?.response?.data?.message || err.message || "Payment verification failed")
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        theme: { color: "#2563eb" },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on("payment.failed", (err: any) => {
        toast.error(err.error?.description || "Payment failed. Please try again.")
        setLoading(false)
      })
      rzp.open()
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || "Could not start demo booking"
      toast.error(msg)
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
      >
        Schedule a demo
      </Button>

      <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Schedule a demo
            </DialogTitle>
            <DialogDescription>
              Book a live walkthrough of PulseCal. A small ₹{DEMO_FEE} fee confirms your slot and
              helps us prioritize serious inquiries.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="demo-name">Full name *</Label>
              <Input
                id="demo-name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Dr. Priya Sharma"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-email">Email *</Label>
              <Input
                id="demo-email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@clinic.com"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-phone">Phone *</Label>
              <Input
                id="demo-phone"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-org">Clinic / organization</Label>
              <Input
                id="demo-org"
                value={form.organization}
                onChange={(e) => update("organization", e.target.value)}
                placeholder="Optional"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-slot">Preferred day / time</Label>
              <Input
                id="demo-slot"
                value={form.preferredSlot}
                onChange={(e) => update("preferredSlot", e.target.value)}
                placeholder="e.g. Weekday evenings"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-message">Anything we should know?</Label>
              <Textarea
                id="demo-message"
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Optional"
                rows={3}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening payment...
                </>
              ) : (
                `Pay ₹${DEMO_FEE} & schedule demo`
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure payment via Razorpay. Our team will reach out after payment.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
