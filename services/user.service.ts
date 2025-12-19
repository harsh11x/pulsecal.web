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
    return await apiService.post<{ url: string }>("/users/profile/picture", formData)
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiService.post("/users/password/change", {
      currentPassword,
      newPassword,
    })
  },

  getAllUsers: async (role?: string): Promise<User[]> => {
    return await apiService.get<User[]>("/users", { params: { role } })
  },

  getUserById: async (id: string): Promise<User> => {
    return await apiService.get<User>(`/users/${id}`)
  },

  createUser: async (data: Partial<User>): Promise<User> => {
    return await apiService.post<User>("/users", data)
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    return await apiService.put<User>(`/users/${id}`, data)
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiService.delete(`/users/${id}`)
  },
}
