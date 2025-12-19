import { mockMedicalRecords } from "@/utils/mockData"
import type { MedicalRecordFormData } from "@/schemas/zodSchemas"

export interface MedicalRecord {
  id: string
  patientId: string
  patientName: string
  date: string
  diagnosis: string
  symptoms: string
  treatment: string
  medications?: string
  doctor: string
  notes?: string
  followUpDate?: string
}

export const medicalRecordService = {
  async getMedicalRecords(): Promise<MedicalRecord[]> {
    return new Promise((resolve) => {
      setTimeout(
        () =>
          resolve([
            ...mockMedicalRecords.map((record) => ({
              ...record,
              patientId: "1",
              patientName: "John Doe",
              symptoms: "Seasonal symptoms",
              treatment: record.treatment,
              medications: "Various medications",
            })),
          ]),
        500,
      )
    })
  },

  async getMedicalRecord(id: string): Promise<MedicalRecord> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const record = mockMedicalRecords.find((r) => r.id === id)
        if (record) {
          resolve({
            ...record,
            patientId: "1",
            patientName: "John Doe",
            symptoms: "Seasonal symptoms",
            treatment: record.treatment,
            medications: "Various medications",
          })
        } else {
          reject(new Error("Medical record not found"))
        }
      }, 500)
    })
  },

  async createMedicalRecord(data: MedicalRecordFormData): Promise<MedicalRecord> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          patientId: data.patientId,
          patientName: "John Doe",
          date: new Date().toISOString().split("T")[0],
          diagnosis: data.diagnosis,
          symptoms: data.symptoms,
          treatment: data.treatment,
          medications: data.medications,
          doctor: "Dr. Sarah Johnson",
          notes: data.notes,
          followUpDate: data.followUpDate?.toISOString().split("T")[0],
        })
      }, 500)
    })
  },

  async updateMedicalRecord(id: string, data: MedicalRecordFormData): Promise<MedicalRecord> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id,
          patientId: data.patientId,
          patientName: "John Doe",
          date: new Date().toISOString().split("T")[0],
          diagnosis: data.diagnosis,
          symptoms: data.symptoms,
          treatment: data.treatment,
          medications: data.medications,
          doctor: "Dr. Sarah Johnson",
          notes: data.notes,
          followUpDate: data.followUpDate?.toISOString().split("T")[0],
        })
      }, 500)
    })
  },

  async deleteMedicalRecord(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500)
    })
  },
}
