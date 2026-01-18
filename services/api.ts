import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios"
import { getIdToken } from "@/lib/firebaseAuth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://13.205.127.21:3001/api/v1"

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
              // Retry the original request
              return this.api(originalRequest)
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError)
            // Fall through to error handling/redirect
          }
        }

        // Only redirect on 401 if we have a response (not network errors) and refresh failed
        if (error.response?.status === 401) {
          // Redirect to login on unauthorized
          if (typeof window !== "undefined" && !window.location.pathname.includes("/auth")) {
            // Store current path to redirect back after login
            // window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`
            // For now, just keep existing behavior but consider user experience
            // console.warn("Authentication required. Please log in again.")
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
