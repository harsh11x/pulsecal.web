export const APP_NAME = "PulseCal"
export const APP_VERSION = "1.0.0"

export const ROLES = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  RECEPTIONIST: "receptionist",
  ADMIN: "admin",
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export const APPOINTMENT_STATUS = {
  SCHEDULED: "scheduled",
  CONFIRMED: "confirmed",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    SIGNUP: "/api/auth/signup",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    VERIFY_EMAIL: "/api/auth/verify-email",
    RESET_PASSWORD: "/api/auth/reset-password",
  },
  APPOINTMENTS: {
    LIST: "/api/appointments",
    CREATE: "/api/appointments",
    GET: (id: string) => `/api/appointments/${id}`,
    UPDATE: (id: string) => `/api/appointments/${id}`,
    DELETE: (id: string) => `/api/appointments/${id}`,
    RESCHEDULE: (id: string) => `/api/appointments/${id}/reschedule`,
    CANCEL: (id: string) => `/api/appointments/${id}/cancel`,
    CHECKIN: (id: string) => `/api/appointments/${id}/checkin`,
  },
  MEDICAL_RECORDS: {
    LIST: "/api/medical-records",
    CREATE: "/api/medical-records",
    GET: (id: string) => `/api/medical-records/${id}`,
    UPDATE: (id: string) => `/api/medical-records/${id}`,
    DELETE: (id: string) => `/api/medical-records/${id}`,
  },
  PRESCRIPTIONS: {
    LIST: "/api/prescriptions",
    CREATE: "/api/prescriptions",
    GET: (id: string) => `/api/prescriptions/${id}`,
    REFILL: (id: string) => `/api/prescriptions/${id}/refill`,
  },
  CHAT: {
    ROOMS: "/api/chat/rooms",
    MESSAGES: (roomId: string) => `/api/chat/rooms/${roomId}/messages`,
    SEND: (roomId: string) => `/api/chat/rooms/${roomId}/send`,
  },
  QUEUE: {
    STATUS: "/api/queue/status",
    UPDATE: (id: string) => `/api/queue/${id}`,
  },
  USERS: {
    PROFILE: "/api/users/profile",
    UPDATE: "/api/users/profile",
    LIST: "/api/users",
  },
} as const

export const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CHAT_MESSAGE: "chat:message",
  APPOINTMENT_UPDATE: "appointment:update",
  QUEUE_UPDATE: "queue:update",
  NOTIFICATION: "notification",
} as const

export const QUERY_KEYS = {
  APPOINTMENTS: "appointments",
  APPOINTMENT: "appointment",
  MEDICAL_RECORDS: "medicalRecords",
  MEDICAL_RECORD: "medicalRecord",
  PRESCRIPTIONS: "prescriptions",
  PRESCRIPTION: "prescription",
  CHAT_ROOMS: "chatRooms",
  CHAT_MESSAGES: "chatMessages",
  QUEUE_STATUS: "queueStatus",
  USER_PROFILE: "userProfile",
  USERS: "users",
} as const
