import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios"
import { getIdToken } from "@/lib/firebaseAuth"

// ALWAYS use relative URL to go through Next.js proxy
// This avoids mixed content errors (HTTPS frontend -> HTTP backend)
const API_BASE_URL = "/api/v1"

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
        console.debug(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, { 
          hasAuth: !!token,
          data: config.data ? (typeof config.data === 'string' ? config.data.substring(0, 100) : 'Object') : 'none'
        })
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

        // For network errors, log them properly for debugging
        if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error") || !error.response) {
          console.error("Network error:", {
            message: error.message,
            code: error.code,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            fullURL: `${error.config?.baseURL}${error.config?.url}`
          })
          // Enhance error with more details
          error.networkError = true
          error.detailedMessage = `Cannot connect to ${error.config?.baseURL}${error.config?.url}. Please check if the backend server is running.`
        }
        // Log all errors for debugging
        if (error.response) {
          console.error("API Error Response:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            method: error.config?.method
          })
        }
        // For network errors, don't redirect - let the calling code handle it
        return Promise.reject(error)
      },
    )
  }

  // Helper to unwrap backend response format { success, data, message }
  private unwrapResponse<T>(responseData: any): T {
    // Check if response follows backend format { success: boolean, data: T, message: string }
    if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
      console.debug("Unwrapping API response:", { success: responseData.success, hasData: !!responseData.data, message: responseData.message })
      return responseData.data as T
    }
    // Return as-is if not in expected format
    console.debug("API response not wrapped, returning as-is:", typeof responseData)
    return responseData as T
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, config)
    return this.unwrapResponse<T>(response.data)
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data, config)
    return this.unwrapResponse<T>(response.data)
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data, config)
    return this.unwrapResponse<T>(response.data)
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data, config)
    return this.unwrapResponse<T>(response.data)
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url, config)
    return this.unwrapResponse<T>(response.data)
  }
}

export const apiService = new ApiService()
