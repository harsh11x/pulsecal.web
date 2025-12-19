import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface Appointment {
  id: string
  doctorId: string
  doctorName: string
  patientName: string
  date: string
  time: string
  status: string
  reason: string
}

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
    addAppointment: (state, action: PayloadAction<Appointment>) => {
      state.appointments.push(action.payload)
    },
    updateAppointment: (state, action: PayloadAction<Appointment>) => {
      const index = state.appointments.findIndex((a) => a.id === action.payload.id)
      if (index !== -1) {
        state.appointments[index] = action.payload
      }
    },
    selectAppointment: (state, action: PayloadAction<Appointment | null>) => {
      state.selectedAppointment = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
  },
})

export const { setAppointments, addAppointment, updateAppointment, selectAppointment, setLoading } =
  appointmentSlice.actions
export default appointmentSlice.reducer
