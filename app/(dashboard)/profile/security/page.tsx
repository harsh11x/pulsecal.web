"use client"

import type React from "react"

import { useState } from "react"
import { userService } from "@/services/user.service"
import { getPasswordChangeErrorMessage } from "@/lib/firebaseAuth"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function SecurityPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (formData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    try {
      setLoading(true)
      await userService.changePassword(formData.currentPassword, formData.newPassword)
      toast.success("Password changed successfully")
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      toast.error(getPasswordChangeErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Security Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your password and security preferences</p>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={loading}>
            <Lock className="mr-2 h-4 w-4" />
            {loading ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
