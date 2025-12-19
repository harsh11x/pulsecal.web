import type { LoginFormData, SignupFormData, PasswordResetFormData } from "@/schemas/zodSchemas"

interface AuthResponse {
  user: {
    id: string
    name: string
    email: string
    role: string
    avatar?: string
  }
  token: string
}

export const authService = {
  async login(data: LoginFormData): Promise<AuthResponse> {
    // Mock implementation for development
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            id: "1",
            name: "John Doe",
            email: data.email,
            role: "patient",
            avatar: "/abstract-geometric-shapes.png",
          },
          token: "mock_jwt_token_" + Date.now(),
        })
      }, 1000)
    })
    // Production: return apiService.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data)
  },

  async signup(data: SignupFormData): Promise<AuthResponse> {
    // Mock implementation for development
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            id: "2",
            name: data.name,
            email: data.email,
            role: data.role,
          },
          token: "mock_jwt_token_" + Date.now(),
        })
      }, 1000)
    })
    // Production: return apiService.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, data)
  },

  async resetPassword(data: PasswordResetFormData): Promise<{ message: string }> {
    // Mock implementation for development
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          message: "Password reset email sent successfully",
        })
      }, 1000)
    })
    // Production: return apiService.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data)
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    // Mock implementation for development
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          message: "Email verified successfully",
        })
      }, 1000)
    })
    // Production: return apiService.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token })
  },

  async logout(): Promise<void> {
    // Production: return apiService.post(API_ENDPOINTS.AUTH.LOGOUT)
    return Promise.resolve()
  },
}
