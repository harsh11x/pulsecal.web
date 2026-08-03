import { apiService } from "./api"
import type { User } from "@/types"

export const userService = {
  getProfile: async (): Promise<User> => {
    return await apiService.get<User>("/users/profile")
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    return await apiService.put<User>("/users/profile", data)
  },

  uploadProfilePicture: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append("file", file)
    return await apiService.post<{ url: string }>("/users/profile/picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    // Prefer Firebase client change (works for all roles; no Admin SDK needed).
    // Fall back to backend endpoint if client auth session is unavailable.
    try {
      const { changePassword } = await import("@/lib/firebaseAuth")
      await changePassword(currentPassword, newPassword)
      return
    } catch (clientErr: any) {
      // If Firebase session missing, try backend; otherwise rethrow client error
      if (
        clientErr?.code &&
        clientErr.code !== "auth/no-current-user" &&
        clientErr.code !== "auth/network-request-failed"
      ) {
        throw clientErr
      }
      try {
        await apiService.post("/users/password/change", {
          currentPassword,
          newPassword,
        })
      } catch {
        throw clientErr
      }
    }
  },

  getAllUsers: async (role?: string): Promise<User[]> => {
    const response = await apiService.get<User[] | { users: User[] }>("/users", {
      params: { role, limit: 200 },
    })
    if (Array.isArray(response)) return response
    return (response as any).users || (response as any).data || []
  },

  getUserById: async (id: string): Promise<User> => {
    return await apiService.get<User>(`/users/${id}`)
  },

  createUser: async (data: Partial<User> & Record<string, unknown>): Promise<User> => {
    return await apiService.post<User>("/users", data)
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    return await apiService.put<User>(`/users/${id}`, data)
  },

  /** Soft-delete user (hidden from lists). Admin preferred path. */
  deleteUser: async (id: string): Promise<void> => {
    try {
      await apiService.patch(`/admin/users/${id}/status`, { isActive: false, permanent: true })
    } catch {
      await apiService.patch(`/users/${id}/status`, { isActive: false, permanent: true })
    }
  },

  suspendUser: async (id: string): Promise<void> => {
    try {
      await apiService.patch(`/admin/users/${id}/status`, { isActive: false, permanent: false })
    } catch {
      await apiService.patch(`/users/${id}/status`, { isActive: false, permanent: false })
    }
  },

  activateUser: async (id: string): Promise<void> => {
    try {
      await apiService.patch(`/admin/users/${id}/status`, { isActive: true })
    } catch {
      await apiService.patch(`/users/${id}/status`, { isActive: true })
    }
  },

  getClinicStaff: async (): Promise<{ doctors: User[]; receptionists: User[]; totalStaff: number }> => {
    return await apiService.get<{ doctors: User[]; receptionists: User[]; totalStaff: number }>(
      "/doctors/clinic/staff"
    )
  },
}
