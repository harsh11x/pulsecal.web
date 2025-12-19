"use client"

import { AuthForm } from "@/components/auth/AuthForm"

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <AuthForm mode="signin" />
    </div>
  )
}

