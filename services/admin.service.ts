import { apiService } from "./api"

export const adminService = {
  getStats: async () => {
    const res: any = await apiService.get("/admin/stats")
    return res?.data ?? res
  },

  getClinics: async () => {
    const res: any = await apiService.get("/admin/clinics", { params: { limit: 100 } })
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data)) return res.data
    if (Array.isArray(res?.clinics)) return res.clinics
    return []
  },

  getClinic: async (id: string) => {
    const res: any = await apiService.get(`/admin/clinics/${id}`)
    return res?.data ?? res
  },

  suspendClinic: async (id: string) => {
    return apiService.patch(`/admin/clinics/${id}/status`, { isActive: false })
  },

  activateClinic: async (id: string) => {
    return apiService.patch(`/admin/clinics/${id}/status`, { isActive: true })
  },

  deleteClinic: async (id: string) => {
    return apiService.delete(`/admin/clinics/${id}`)
  },
}
