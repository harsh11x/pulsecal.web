export const mockUser = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
  role: "patient" as const,
  avatar: "/abstract-geometric-shapes.png",
}

export const mockDoctors = [
  {
    id: "d1",
    name: "Dr. Sarah Johnson",
    specialty: "Cardiology",
    avatar: "/caring-doctor.png",
    rating: 4.8,
  },
  {
    id: "d2",
    name: "Dr. Michael Chen",
    specialty: "Pediatrics",
    avatar: "/caring-doctor.png",
    rating: 4.9,
  },
  {
    id: "d3",
    name: "Dr. Emily Rodriguez",
    specialty: "Dermatology",
    avatar: "/caring-doctor.png",
    rating: 4.7,
  },
]

export const mockAppointments = [
  {
    id: "1",
    doctorId: "d1",
    doctorName: "Dr. Sarah Johnson",
    patientName: "John Doe",
    date: "2025-01-15",
    time: "10:00 AM",
    status: "scheduled",
    reason: "Regular checkup",
  },
  {
    id: "2",
    doctorId: "d2",
    doctorName: "Dr. Michael Chen",
    patientName: "Jane Smith",
    date: "2025-01-16",
    time: "2:30 PM",
    status: "confirmed",
    reason: "Follow-up visit",
  },
]

export const mockMedicalRecords = [
  {
    id: "mr1",
    date: "2024-12-10",
    diagnosis: "Seasonal Allergies",
    doctor: "Dr. Sarah Johnson",
    treatment: "Antihistamine medication",
  },
  {
    id: "mr2",
    date: "2024-11-05",
    diagnosis: "Annual Physical",
    doctor: "Dr. Michael Chen",
    treatment: "General health assessment - all clear",
  },
]

export const mockPrescriptions = [
  {
    id: "p1",
    medication: "Lisinopril 10mg",
    doctor: "Dr. Sarah Johnson",
    date: "2024-12-15",
    refillsRemaining: 2,
    status: "active",
  },
  {
    id: "p2",
    medication: "Metformin 500mg",
    doctor: "Dr. Michael Chen",
    date: "2024-11-20",
    refillsRemaining: 0,
    status: "expired",
  },
]
