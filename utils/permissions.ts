import { type UserRole, ROLES } from "./constants"

export const PERMISSIONS = {
  // Appointment permissions
  VIEW_ALL_APPOINTMENTS: [ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN],
  CREATE_APPOINTMENT: [ROLES.PATIENT, ROLES.RECEPTIONIST, ROLES.ADMIN],
  UPDATE_APPOINTMENT: [ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN],
  CANCEL_APPOINTMENT: [ROLES.PATIENT, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN],

  // Medical records permissions
  VIEW_ALL_RECORDS: [ROLES.DOCTOR, ROLES.ADMIN],
  CREATE_RECORD: [ROLES.DOCTOR, ROLES.ADMIN],
  UPDATE_RECORD: [ROLES.DOCTOR, ROLES.ADMIN],

  // Prescription permissions
  VIEW_ALL_PRESCRIPTIONS: [ROLES.DOCTOR, ROLES.ADMIN],
  CREATE_PRESCRIPTION: [ROLES.DOCTOR],
  REFILL_PRESCRIPTION: [ROLES.PATIENT, ROLES.DOCTOR],

  // Admin permissions
  VIEW_ADMIN_DASHBOARD: [ROLES.ADMIN],
  MANAGE_USERS: [ROLES.ADMIN],
  VIEW_AUDIT_LOGS: [ROLES.ADMIN],
  VIEW_ANALYTICS: [ROLES.DOCTOR, ROLES.ADMIN],

  // Queue permissions
  MANAGE_QUEUE: [ROLES.RECEPTIONIST, ROLES.ADMIN],
  VIEW_QUEUE: [ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN],
} as const

export const hasPermission = (userRole: UserRole, permission: keyof typeof PERMISSIONS): boolean => {
  return PERMISSIONS[permission].includes(userRole)
}

export const canAccessRoute = (userRole: UserRole, route: string): boolean => {
  const routePermissions: Record<string, keyof typeof PERMISSIONS> = {
    "/admin/dashboard": "VIEW_ADMIN_DASHBOARD",
    "/admin/users": "MANAGE_USERS",
    "/admin/audit-logs": "VIEW_AUDIT_LOGS",
    "/admin/analytics": "VIEW_ANALYTICS",
    "/dashboard/analytics": "VIEW_ANALYTICS",
    "/queue/status": "VIEW_QUEUE",
  }

  const permission = routePermissions[route]
  if (!permission) return true // Allow access to routes without specific permissions

  return hasPermission(userRole, permission)
}
