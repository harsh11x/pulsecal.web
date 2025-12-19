"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>Please check your email and click the verification link</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We've sent a verification email to your inbox. Please click the link in the email to verify your account.
            </p>
            <Button className="w-full">Resend Verification Email</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

