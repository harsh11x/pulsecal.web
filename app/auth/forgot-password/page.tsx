"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { resetPassword } from "@/lib/firebaseAuth"

function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      toast.error("Please enter your email address")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address")
      return
    }

    setLoading(true)
    try {
      await resetPassword(trimmed)
      setSent(true)
      toast.success("Password reset email sent. Check your inbox.")
    } catch (error: any) {
      const code = error?.code || ""
      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        toast.error("No account found with this email")
      } else if (code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please try again later.")
      } else {
        toast.error(error?.message || "Failed to send reset email. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          {sent
            ? "If an account exists for that email, a reset link has been sent."
            : "Enter your email to receive a password reset link"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Check <strong>{email.trim()}</strong> for a link from Firebase/PulseCal. You can close this page after resetting.
            </p>
            <Button className="w-full" variant="outline" onClick={() => router.push("/auth/login")}>
              Back to Sign In
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => {
                setSent(false)
              }}
            >
              Send again
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
            <Button type="button" variant="ghost" className="w-full" asChild>
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

export default function ForgotPasswordPage() {
  return (
    <div className="container relative flex min-h-screen flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}
