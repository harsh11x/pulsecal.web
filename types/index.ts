export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  dateOfBirth?: string
  role: "patient" | "doctor" | "receptionist" | "admin"
  isActive: boolean
  isEmailVerified: boolean
  profileImage?: string
  onboardingCompleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  scheduledAt: string
  duration: number
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show"
  reason?: string
  notes?: string
  diagnosis?: string
  createdAt: string
  updatedAt: string
}

export interface DoctorProfile {
  id: string
  userId: string
  licenseNumber: string
  specialization: string
  qualifications?: string
  yearsOfExperience?: number
  bio?: string
  consultationFee: number
  clinicName?: string
  clinicAddress?: string
  clinicLatitude?: number
  clinicLongitude?: number
  workingHours?: WorkingHours
  services?: string[]
  profileImage?: string
}

export interface WorkingHours {
  monday?: { start: string; end: string; isOpen: boolean }
  tuesday?: { start: string; end: string; isOpen: boolean }
  wednesday?: { start: string; end: string; isOpen: boolean }
  thursday?: { start: string; end: string; isOpen: boolean }
  friday?: { start: string; end: string; isOpen: boolean }
  saturday?: { start: string; end: string; isOpen: boolean }
  sunday?: { start: string; end: string; isOpen: boolean }
}

export interface Clinic {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  phone?: string
  email?: string
  doctorId: string
  createdAt: string
}

export interface Payment {
  id: string
  appointmentId: string
  amount: number
  status: "pending" | "completed" | "failed" | "refunded"
  method: "credit_card" | "debit_card" | "insurance" | "cash" | "bank_transfer"
  createdAt: string
}

