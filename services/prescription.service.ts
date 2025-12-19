import { mockPrescriptions } from "@/utils/mockData"
import type { PrescriptionFormData } from "@/schemas/zodSchemas"

export interface Prescription {
  id: string
  patientId: string
  patientName: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  refills: number
  refillsRemaining: number
  doctor: string
  date: string
  status: "active" | "expired" | "refill_requested"
}

export const prescriptionService = {
  async getPrescriptions(): Promise<Prescription[]> {
    return new Promise((resolve) => {
      setTimeout(
        () =>
          resolve([
            ...mockPrescriptions.map((prescription) => ({
              ...prescription,
              patientId: "1",
              patientName: "John Doe",
              dosage: "10mg",
              frequency: "Once daily",
              duration: "30 days",
              refills: 3,
            })),
          ]),
        500,
      )
    })
  },

  async getPrescription(id: string): Promise<Prescription> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const prescription = mockPrescriptions.find((p) => p.id === id)
        if (prescription) {
          resolve({
            ...prescription,
            patientId: "1",
            patientName: "John Doe",
            dosage: "10mg",
            frequency: "Once daily",
            duration: "30 days",
            refills: 3,
          })
        } else {
          reject(new Error("Prescription not found"))
        }
      }, 500)
    })
  },

  async createPrescription(data: PrescriptionFormData): Promise<Prescription> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          patientId: data.patientId,
          patientName: "John Doe",
          medication: data.medication,
          dosage: data.dosage,
          frequency: data.frequency,
          duration: data.duration,
          instructions: data.instructions,
          refills: data.refills,
          refillsRemaining: data.refills,
          doctor: "Dr. Sarah Johnson",
          date: new Date().toISOString().split("T")[0],
          status: "active",
        })
      }, 500)
    })
  },

  async requestRefill(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500)
    })
  },
}
