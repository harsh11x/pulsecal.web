import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios"
import { getIdToken } from "@/lib/firebaseAuth"

const API_BASE_URL = ""

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    })

    this.api.interceptors.request.use(
      async (config) => {
        // Get Firebase ID token
        const token = await getIdToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            // Attempt to refresh the token
            console.debug("Token expired or invalid, attempting refresh...")
            const token = await getIdToken(true) // Force refresh

            if (token) {
              console.debug("Token refreshed successfully, retrying request...")
              // Update the header with the new token
              originalRequest.headers.Authorization = `Bearer ${token}`
              // Update the default header for future requests as well
              this.api.defaults.headers.common["Authorization"] = `Bearer ${token}`

              // Add a small delay to ensure the token is fully propagated
              await new Promise(resolve => setTimeout(resolve, 500))

              // Retry the original request
              return this.api(originalRequest)
            } else {
              // No token available, redirect to login
              console.error("No token available after refresh attempt")
              if (typeof window !== "undefined" && !window.location.pathname.includes("/auth")) {
                window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`
              }
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError)
            // Redirect to login on failed refresh
            if (typeof window !== "undefined" && !window.location.pathname.includes("/auth")) {
              window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`
            }
          }
        }

        // Handle 403 Forbidden (insufficient permissions)
        if (error.response?.status === 403) {
          console.error("Insufficient permissions for this action")
          // Try refreshing token once in case role was just updated
          if (!originalRequest._permissionRetry) {
            originalRequest._permissionRetry = true
            try {
              const token = await getIdToken(true)
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`
                await new Promise(resolve => setTimeout(resolve, 500))
                return this.api(originalRequest)
              }
            } catch (refreshError) {
              console.error("Permission refresh failed:", refreshError)
            }
          }
        }

        // For network errors, suppress console errors to prevent "Load failed" spam
        if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
          // Silently handle network errors - components should handle fallbacks
          console.debug("Network error (suppressed):", error.message)
        }
        // For network errors, don't redirect - let the calling code handle it
        return Promise.reject(error)
      },
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, config)
    return response.data
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url, config)
    return response.data
  }
}

export const apiService = new ApiService()
