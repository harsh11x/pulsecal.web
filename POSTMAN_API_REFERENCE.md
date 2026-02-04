# PulseCal API Reference for Postman

**Base URL:** `http://13.205.127.21:3001/api/v1`  
**Authentication:** Bearer token (Firebase ID token) in `Authorization` header  
**Header:** `Authorization: Bearer <YOUR_FIREBASE_TOKEN>`

---

## Auth
| Method | Full URL | Description |
|--------|----------|-------------|
| GET | `azAaaa` | Get current user profile |
| POST | `http://13.205.127.21:3001/api/v1/auth/sync-profile` | Sync Firebase profile to backend |

---

## Users
| Method | Full URL | Description |
|--------|----------|-------------|
| GET | `http://13.205.127.21:3001/api/v1/users/profile` | Get user profile |
| PUT | `http://13.205.127.21:3001/api/v1/users/profile` | Update user profile |
| POST | `http://13.205.127.21:3001/api/v1/users` | Create user (Staff) |
| GET | `http://13.205.127.21:3001/api/v1/users` | Get all users (Staff) |
| GET | `http://13.205.127.21:3001/api/v1/users/:id` | Get user by ID (Staff) |
| PATCH | `http://13.205.127.21:3001/api/v1/users/:id/status` | Update user status (Admin) |

---

## Appointments
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/appointments/self` | Patient self-booking (free) |
| POST | `http://13.205.127.21:3001/api/v1/appointments` | Create appointment (Doctor/Receptionist) |
| GET | `http://13.205.127.21:3001/api/v1/appointments` | List appointments (query: date, patientId, doctorId, status) |
| GET | `http://13.205.127.21:3001/api/v1/appointments/:id` | Get appointment by ID |
| PUT | `http://13.205.127.21:3001/api/v1/appointments/:id` | Update appointment |
| POST | `http://13.205.127.21:3001/api/v1/appointments/:id/reschedule` | Reschedule (body: { scheduledAt }) |
| POST | `http://13.205.127.21:3001/api/v1/appointments/:id/cancel` | Cancel (body: { cancellationReason? }) |
| POST | `http://13.205.127.21:3001/api/v1/appointments/:id/checkin` | Check-in patient |
| DELETE | `http://13.205.127.21:3001/api/v1/appointments/:id` | Delete appointment |

---

## Doctors
| Method | Full URL | Description |
|--------|----------|-------------|
| GET | `http://13.205.127.21:3001/api/v1/doctors/search` | Search doctors (query: search, reason, latitude, longitude, radius, limit) |
| GET | `http://13.205.127.21:3001/api/v1/doctors/:id` | Get doctor by ID |
| GET | `http://13.205.127.21:3001/api/v1/doctors/:id/availability` | Get availability (query: date) |
| GET | `http://13.205.127.21:3001/api/v1/doctors/:id/slots` | Get slots for booking (query: days) |
| GET | `http://13.205.127.21:3001/api/v1/doctors/schedule` | Get doctor schedule |
| POST | `http://13.205.127.21:3001/api/v1/doctors/schedule` | Update schedule (Doctor) |
| GET | `http://13.205.127.21:3001/api/v1/doctors/analytics` | Get analytics (Doctor) |
| GET | `http://13.205.127.21:3001/api/v1/doctors/financial-reports` | Get financial reports (Doctor) |
| GET | `http://13.205.127.21:3001/api/v1/doctors/clinic/staff` | Get clinic staff (Doctor) |
| POST | `http://13.205.127.21:3001/api/v1/doctors/subscription/create` | Create subscription order |
| POST | `http://13.205.127.21:3001/api/v1/doctors/subscription/verify` | Verify subscription payment |

---

## Doctor Profiles
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/doctor-profiles` | Create doctor profile |
| GET | `http://13.205.127.21:3001/api/v1/doctor-profiles/me` | Get my doctor profile |
| PUT | `http://13.205.127.21:3001/api/v1/doctor-profiles/me` | Update my profile |
| PUT | `http://13.205.127.21:3001/api/v1/doctor-profiles` | Update profile |

---

## Patient Profiles
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/patient-profiles` | Create patient profile |
| GET | `http://13.205.127.21:3001/api/v1/patient-profiles` | Get my patient profile |
| GET | `http://13.205.127.21:3001/api/v1/patient-profiles/:id` | Get patient profile by ID (Staff) |

---

## Clinics
| Method | Full URL | Description |
|--------|----------|-------------|
| GET | `http://13.205.127.21:3001/api/v1/clinics` | List clinics (query: latitude, longitude, radius, limit) |
| GET | `http://13.205.127.21:3001/api/v1/clinics/:id` | Get clinic by ID |
| POST | `http://13.205.127.21:3001/api/v1/clinics` | Create clinic |
| PUT | `http://13.205.127.21:3001/api/v1/clinics/:id` | Update clinic |
| DELETE | `http://13.205.127.21:3001/api/v1/clinics/:id` | Delete clinic (Admin) |

---

## Receptionists
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/receptionists` | Link receptionist to clinic (body: { clinicId }) |
| GET | `http://13.205.127.21:3001/api/v1/receptionists/stats` | Get receptionist stats |
| GET | `http://13.205.127.21:3001/api/v1/receptionists/queue` | Get queue status |
| GET | `http://13.205.127.21:3001/api/v1/receptionists/doctors` | Get clinic doctors |
| POST | `http://13.205.127.21:3001/api/v1/receptionists/patients` | Register offline patient |

---

## Payments
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/payments/create-order` | Create Razorpay order (body: { appointmentId, amount }) |
| POST | `http://13.205.127.21:3001/api/v1/payments/verify` | Verify payment |
| POST | `http://13.205.127.21:3001/api/v1/payments/appointment/create-order` | Create order for patient booking (body: { doctorId, scheduledAt, amount, reason? }) |
| POST | `http://13.205.127.21:3001/api/v1/payments/appointment/verify` | Verify appointment payment |
| POST | `http://13.205.127.21:3001/api/v1/payments/create-subscription` | Create subscription |
| POST | `http://13.205.127.21:3001/api/v1/payments/verify-subscription` | Verify subscription |
| POST | `http://13.205.127.21:3001/api/v1/payments/cancel-subscription/:id` | Cancel subscription |
| GET | `http://13.205.127.21:3001/api/v1/payments` | List payments |
| GET | `http://13.205.127.21:3001/api/v1/payments/:id` | Get payment by ID |
| PATCH | `http://13.205.127.21:3001/api/v1/payments/:id/status` | Update payment status (Receptionist) |
| DELETE | `http://13.205.127.21:3001/api/v1/payments/:id` | Delete payment (Staff) |

---

## Payment Gateway (Doctor Onboarding)
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/payment-gateway/create-order` | Create order (body: { plan, billingCycle? }) |
| POST | `http://13.205.127.21:3001/api/v1/payment-gateway/verify` | Verify payment |

---

## Medical Records
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/medical-records` | Create medical record (Doctor) |
| GET | `http://13.205.127.21:3001/api/v1/medical-records` | List medical records |
| GET | `http://13.205.127.21:3001/api/v1/medical-records/:id` | Get medical record |
| PUT | `http://13.205.127.21:3001/api/v1/medical-records/:id` | Update (Doctor) |
| DELETE | `http://13.205.127.21:3001/api/v1/medical-records/:id` | Delete (Staff) |

---

## Prescriptions
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/prescriptions` | Create prescription (Doctor) |
| GET | `http://13.205.127.21:3001/api/v1/prescriptions` | List prescriptions |
| GET | `http://13.205.127.21:3001/api/v1/prescriptions/:id` | Get prescription |
| PUT | `http://13.205.127.21:3001/api/v1/prescriptions/:id` | Update (Doctor) |
| POST | `http://13.205.127.21:3001/api/v1/prescriptions/:id/refill` | Request refill |
| DELETE | `http://13.205.127.21:3001/api/v1/prescriptions/:id` | Delete (Staff) |

---

## Insurance
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/insurance` | Create/update insurance (Patient) |
| GET | `http://13.205.127.21:3001/api/v1/insurance` | Get insurance (Patient) |
| DELETE | `http://13.205.127.21:3001/api/v1/insurance` | Delete insurance (Patient) |

---

## Emergency Contacts
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/emergency-contacts` | Create contact (Patient) |
| GET | `http://13.205.127.21:3001/api/v1/emergency-contacts` | List contacts (Patient) |
| GET | `http://13.205.127.21:3001/api/v1/emergency-contacts/:id` | Get contact |
| PUT | `http://13.205.127.21:3001/api/v1/emergency-contacts/:id` | Update (Patient) |
| DELETE | `http://13.205.127.21:3001/api/v1/emergency-contacts/:id` | Delete (Patient) |

---

## Reminders
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/reminders` | Create reminder (Patient) |
| GET | `http://13.205.127.21:3001/api/v1/reminders` | List reminders |
| GET | `http://13.205.127.21:3001/api/v1/reminders/:id` | Get reminder |
| PUT | `http://13.205.127.21:3001/api/v1/reminders/:id` | Update (Patient) |
| POST | `http://13.205.127.21:3001/api/v1/reminders/:id/complete` | Mark complete (Patient) |
| DELETE | `http://13.205.127.21:3001/api/v1/reminders/:id` | Delete (Patient) |

---

## Chat
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/chat/rooms` | Create chat room |
| GET | `http://13.205.127.21:3001/api/v1/chat/rooms` | List chat rooms |
| GET | `http://13.205.127.21:3001/api/v1/chat/rooms/:id` | Get chat room |
| GET | `http://13.205.127.21:3001/api/v1/chat/rooms/:roomId/messages` | Get messages |
| POST | `http://13.205.127.21:3001/api/v1/chat/rooms/:roomId/messages` | Send message |
| POST | `http://13.205.127.21:3001/api/v1/chat/rooms/:roomId/read` | Mark as read |
| DELETE | `http://13.205.127.21:3001/api/v1/chat/messages/:id` | Delete message |

---

## Queue
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/queue` | Add to queue |
| GET | `http://13.205.127.21:3001/api/v1/queue` | Get queue |
| GET | `http://13.205.127.21:3001/api/v1/queue/status` | Get queue status |
| POST | `http://13.205.127.21:3001/api/v1/queue/next` | Call next patient (Doctor) |
| PUT | `http://13.205.127.21:3001/api/v1/queue/:id` | Update queue entry (Receptionist) |
| POST | `http://13.205.127.21:3001/api/v1/queue/:id/complete` | Complete entry (Receptionist) |
| DELETE | `http://13.205.127.21:3001/api/v1/queue/:id` | Remove from queue |

---

## Health Analytics
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/health-analytics` | Create metric (Patient) |
| GET | `http://13.205.127.21:3001/api/v1/health-analytics` | Get metrics |
| GET | `http://13.205.127.21:3001/api/v1/health-analytics/:id` | Get metric |
| PUT | `http://13.205.127.21:3001/api/v1/health-analytics/:id` | Update (Patient) |
| DELETE | `http://13.205.127.21:3001/api/v1/health-analytics/:id` | Delete (Patient) |

---

## Telemedicine
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/telemedicine/:appointmentId` | Create session (Doctor) |
| GET | `http://13.205.127.21:3001/api/v1/telemedicine/:appointmentId` | Get session |
| POST | `http://13.205.127.21:3001/api/v1/telemedicine/:appointmentId/start` | Start session (Doctor) |
| POST | `http://13.205.127.21:3001/api/v1/telemedicine/:appointmentId/end` | End session (Doctor) |

---

## Reviews
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/reviews` | Create review (Patient) |
| GET | `http://13.205.127.21:3001/api/v1/reviews` | List reviews |

---

## Data Export
| Method | Full URL | Description |
|--------|----------|-------------|
| POST | `http://13.205.127.21:3001/api/v1/data/export` | Export user data (Patient) |
| GET | `http://13.205.127.21:3001/api/v1/data/exports` | Get export history (Patient) |
| DELETE | `http://13.205.127.21:3001/api/v1/data/exports/:id` | Delete export (Patient) |

---

## Admin
| Method | Full URL | Description |
|--------|----------|-------------|
| GET | `http://13.205.127.21:3001/api/v1/admin/audit-logs` | Get audit logs |
| GET | `http://13.205.127.21:3001/api/v1/admin/stats` | Get system stats |
| GET | `http://13.205.127.21:3001/api/v1/admin/clinics` | Get all clinics |
| GET | `http://13.205.127.21:3001/api/v1/admin/clinics/:id` | Get clinic details |

---

## Example Postman Setup

1. **Environment variables:**
   - `base_url`: `http://13.205.127.21:3001/api/v1`
   - `token`: Your Firebase ID token

2. **Request URL (example):** `http://13.205.127.21:3001/api/v1/appointments`

3. **Headers:**
   - `Authorization`: `Bearer <YOUR_TOKEN>`
   - `Content-Type`: `application/json`

4. **Replace :id placeholders** with actual IDs when testing (e.g. `:id` → `abc123`).

5. **To get Firebase token:** Sign in via the PulseCal app, open browser DevTools → Network tab, inspect any API request, copy the `Authorization` header value.
