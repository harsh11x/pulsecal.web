"use client"

import { Suspense } from "react"
import { AuthForm } from "@/components/auth/AuthForm"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />}>
        <AuthForm mode="signin" />
      </Suspense>
    </div>
  )
}

