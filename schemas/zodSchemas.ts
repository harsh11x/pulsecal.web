import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["patient", "doctor", "receptionist", "admin"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export const passwordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const appointmentSchema = z.object({
  doctorId: z.string().min(1, "Doctor is required"),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().min(1, "Time is required"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  notes: z.string().optional(),
})

export const medicalRecordSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  diagnosis: z.string().min(5, "Diagnosis is required"),
  symptoms: z.string().min(5, "Symptoms are required"),
  treatment: z.string().min(5, "Treatment is required"),
  medications: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.date().optional(),
})

export const prescriptionSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  medication: z.string().min(2, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  instructions: z.string().optional(),
  refills: z.number().min(0).max(12),
})

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  dateOfBirth: z.date().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>
export type AppointmentFormData = z.infer<typeof appointmentSchema>
export type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>
export type PrescriptionFormData = z.infer<typeof prescriptionSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
