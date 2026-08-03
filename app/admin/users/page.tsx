"use client"

import { useEffect, useState } from "react"
import { userService } from "@/services/user.service"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Pencil, Trash2, Ban, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import type { User } from "@/types"
import { toast } from "sonner"
import { useAppSelector } from "@/app/hooks"

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const currentUser = useAppSelector((s) => s.auth.user)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchQuery, roleFilter, statusFilter, users])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await userService.getAllUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => String(user.role).toUpperCase() === roleFilter)
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((user) => user.isActive !== false)
    } else if (statusFilter === "suspended") {
      filtered = filtered.filter((user) => user.isActive === false)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase().includes(q) ||
          (user.email || "").toLowerCase().includes(q)
      )
    }

    setFilteredUsers(filtered)
  }

  const runAction = async (
    id: string,
    action: "suspend" | "activate" | "delete",
    confirmMsg: string
  ) => {
    if (currentUser?.id === id) {
      toast.error("You cannot suspend or delete your own admin account")
      return
    }
    if (!confirm(confirmMsg)) return

    try {
      setBusyId(id)
      if (action === "suspend") await userService.suspendUser(id)
      if (action === "activate") await userService.activateUser(id)
      if (action === "delete") await userService.deleteUser(id)
      toast.success(
        action === "suspend"
          ? "User suspended"
          : action === "activate"
            ? "User activated"
            : "User deleted"
      )
      await loadUsers()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${action} user`)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Suspend, activate, or delete any user on the platform
          </p>
        </div>
        <Link href="/admin/users/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-md bg-background"
          >
            <option value="all">All Roles</option>
            <option value="PATIENT">Patients</option>
            <option value="DOCTOR">Doctors</option>
            <option value="RECEPTIONIST">Receptionists</option>
            <option value="ADMIN">Admins</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-md bg-background"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Phone</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const active = user.isActive !== false
                const isSelf = currentUser?.id === user.id
                return (
                  <tr key={user.id} className="border-b border-border hover:bg-accent/50">
                    <td className="py-3 px-4 font-medium">
                      {user.firstName} {user.lastName}
                      {isSelf ? <span className="ml-2 text-xs text-muted-foreground">(you)</span> : null}
                    </td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary">
                        {String(user.role).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">{user.phone || "N/A"}</td>
                    <td className="py-3 px-4">
                      <Badge variant={active ? "default" : "secondary"}>
                        {active ? "Active" : "Suspended"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <Button variant="ghost" size="sm" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        {active ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Suspend"
                            disabled={!!busyId || isSelf}
                            onClick={() =>
                              runAction(
                                user.id,
                                "suspend",
                                `Suspend ${user.firstName} ${user.lastName}? They will not be able to sign in.`
                              )
                            }
                          >
                            <Ban className="h-4 w-4 text-amber-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Activate"
                            disabled={!!busyId || isSelf}
                            onClick={() =>
                              runAction(user.id, "activate", `Activate ${user.firstName} ${user.lastName}?`)
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete"
                          disabled={!!busyId || isSelf}
                          onClick={() =>
                            runAction(
                              user.id,
                              "delete",
                              `Permanently delete ${user.firstName} ${user.lastName}? This soft-deletes the account.`
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
