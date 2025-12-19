import { mockAppointments, mockDoctors } from "@/utils/mockData"
import type { AppointmentFormData } from "@/schemas/zodSchemas"

export interface Appointment {
  id: string
  doctorId: string
  doctorName: string
  patientName: string
  date: string
  time: string
  status: string
  reason: string
  notes?: string
}

export const appointmentService = {
  async getAppointments(): Promise<Appointment[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockAppointments]), 500)
    })
  },

  async getAppointment(id: string): Promise<Appointment> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const appointment = mockAppointments.find((a) => a.id === id)
        if (appointment) {
          resolve(appointment)
        } else {
          reject(new Error("Appointment not found"))
        }
      }, 500)
    })
  },

  async createAppointment(data: AppointmentFormData): Promise<Appointment> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const doctor = mockDoctors.find((d) => d.id === data.doctorId)
        const newAppointment: Appointment = {
          id: Date.now().toString(),
          doctorId: data.doctorId,
          doctorName: doctor?.name || "Unknown Doctor",
          patientName: "Current User",
          date: data.date.toISOString().split("T")[0],
          time: data.time,
          status: "scheduled",
          reason: data.reason,
          notes: data.notes,
        }
        resolve(newAppointment)
      }, 500)
    })
  },

  async rescheduleAppointment(id: string, date: Date, time: string): Promise<Appointment> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const appointment = mockAppointments.find((a) => a.id === id)
        if (appointment) {
          resolve({
            ...appointment,
            date: date.toISOString().split("T")[0],
            time,
          })
        } else {
          reject(new Error("Appointment not found"))
        }
      }, 500)
    })
  },

  async cancelAppointment(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500)
    })
  },

  async checkInAppointment(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500)
    })
  },

  async getDoctors() {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockDoctors]), 500)
    })
  },
}
