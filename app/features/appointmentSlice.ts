import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Appointment } from "@/types"

interface AppointmentState {
  appointments: Appointment[]
  selectedAppointment: Appointment | null
  loading: boolean
}

const initialState: AppointmentState = {
  appointments: [],
  selectedAppointment: null,
  loading: false,
}

const appointmentSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    setAppointments: (state, action: PayloadAction<Appointment[]>) => {
      state.appointments = action.payload
    },
    setSelectedAppointment: (state, action: PayloadAction<Appointment | null>) => {
      state.selectedAppointment = action.payload
    },
    addAppointment: (state, action: PayloadAction<Appointment>) => {
      state.appointments.push(action.payload)
    },
    updateAppointment: (state, action: PayloadAction<Appointment>) => {
      const index = state.appointments.findIndex((apt) => apt.id === action.payload.id)
      if (index !== -1) {
        state.appointments[index] = action.payload
      }
    },
    removeAppointment: (state, action: PayloadAction<string>) => {
      state.appointments = state.appointments.filter((apt) => apt.id !== action.payload)
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
  },
})

export const {
  setAppointments,
  setSelectedAppointment,
  addAppointment,
  updateAppointment,
  removeAppointment,
  setLoading,
} = appointmentSlice.actions
export default appointmentSlice.reducer
