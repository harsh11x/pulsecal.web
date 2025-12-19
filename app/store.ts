import { configureStore } from "@reduxjs/toolkit"
import authReducer from "@/app/features/authSlice"
import appointmentReducer from "@/app/features/appointmentSlice"
import notificationReducer from "@/app/features/notificationSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    appointments: appointmentReducer,
    notifications: notificationReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
