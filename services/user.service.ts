import apiClient from "./api"
import type { User } from "@/types"

export const userService = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get("/users/profile")
    return response.data
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put("/users/profile", data)
    return response.data
  },

  uploadProfilePicture: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await apiClient.post("/users/profile/picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post("/users/password/change", {
      currentPassword,
      newPassword,
    })
  },

  getAllUsers: async (role?: string): Promise<User[]> => {
    const response = await apiClient.get("/users", { params: { role } })
    return response.data
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`)
    return response.data
  },

  createUser: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.post("/users", data)
    return response.data
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, data)
    return response.data
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`)
  },
}
