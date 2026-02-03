# PulseCal API Reference for Postman

**Base URL:** `http://13.205.127.21:3001/api/v1`  
**Authentication:** Bearer token (Firebase ID token) in `Authorization` header  
**Header:** `Authorization: Bearer <YOUR_FIREBASE_TOKEN>`

---

## Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/profile` | Get current user profile |
| POST | `/auth/sync-profile` | Sync Firebase profile to backend |

---

## Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile` | Get user profile |
| PUT | `/users/profile` | Update user profile |
| POST | `/users` | Create user (Staff) |
| GET | `/users` | Get all users (Staff) |
| GET | `/users/:id` | Get user by ID (Staff) |
| PATCH | `/users/:id/status` | Update user status (Admin) |

---

## Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/appointments/self` | Patient self-booking (free) |
| POST | `/appointments` | Create appointment (Doctor/Receptionist) |
| GET | `/appointments` | List appointments (query: date, patientId, doctorId, status) |
| GET | `/appointments/:id` | Get appointment by ID |
| PUT | `/appointments/:id` | Update appointment |
| POST | `/appointments/:id/reschedule` | Reschedule (body: { scheduledAt }) |
| POST | `/appointments/:id/cancel` | Cancel (body: { cancellationReason? }) |
| POST | `/appointments/:id/checkin` | Check-in patient |
| DELETE | `/appointments/:id` | Delete appointment |

---

## Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctors/search` | Search doctors (query: search, reason, latitude, longitude, radius, limit) |
| GET | `/doctors/:id` | Get doctor by ID |
| GET | `/doctors/:id/availability` | Get availability (query: date) |
| GET | `/doctors/:id/slots` | Get slots for booking (query: days) |
| GET | `/doctors/schedule` | Get doctor schedule |
| POST | `/doctors/schedule` | Update schedule (Doctor) |
| GET | `/doctors/analytics` | Get analytics (Doctor) |
| GET | `/doctors/financial-reports` | Get financial reports (Doctor) |
| GET | `/doctors/clinic/staff` | Get clinic staff (Doctor) |
| POST | `/doctors/subscription/create` | Create subscription order |
| POST | `/doctors/subscription/verify` | Verify subscription payment |

---

## Doctor Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/doctor-profiles` | Create doctor profile |
| GET | `/doctor-profiles/me` | Get my doctor profile |
| PUT | `/doctor-profiles/me` | Update my profile |
| PUT | `/doctor-profiles` | Update profile |

---

## Patient Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/patient-profiles` | Create patient profile |
| GET | `/patient-profiles` | Get my patient profile |
| GET | `/patient-profiles/:id` | Get patient profile by ID (Staff) |

---

## Clinics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/clinics` | List clinics (query: latitude, longitude, radius, limit) |
| GET | `/clinics/:id` | Get clinic by ID |
| POST | `/clinics` | Create clinic |
| PUT | `/clinics/:id` | Update clinic |
| DELETE | `/clinics/:id` | Delete clinic (Admin) |

---

## Receptionists
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/receptionists` | Link receptionist to clinic (body: { clinicId }) |
| GET | `/receptionists/stats` | Get receptionist stats |
| GET | `/receptionists/queue` | Get queue status |
| GET | `/receptionists/doctors` | Get clinic doctors |
| POST | `/receptionists/patients` | Register offline patient |

---

## Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/create-order` | Create Razorpay order (body: { appointmentId, amount }) |
| POST | `/payments/verify` | Verify payment |
| POST | `/payments/appointment/create-order` | Create order for patient booking (body: { doctorId, scheduledAt, amount, reason? }) |
| POST | `/payments/appointment/verify` | Verify appointment payment |
| POST | `/payments/create-subscription` | Create subscription |
| POST | `/payments/verify-subscription` | Verify subscription |
| POST | `/payments/cancel-subscription/:id` | Cancel subscription |
| GET | `/payments` | List payments |
| GET | `/payments/:id` | Get payment by ID |
| PATCH | `/payments/:id/status` | Update payment status (Receptionist) |
| DELETE | `/payments/:id` | Delete payment (Staff) |

---

## Payment Gateway (Doctor Onboarding)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payment-gateway/create-order` | Create order (body: { plan, billingCycle? }) |
| POST | `/payment-gateway/verify` | Verify payment |

---

## Medical Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/medical-records` | Create medical record (Doctor) |
| GET | `/medical-records` | List medical records |
| GET | `/medical-records/:id` | Get medical record |
| PUT | `/medical-records/:id` | Update (Doctor) |
| DELETE | `/medical-records/:id` | Delete (Staff) |

---

## Prescriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/prescriptions` | Create prescription (Doctor) |
| GET | `/prescriptions` | List prescriptions |
| GET | `/prescriptions/:id` | Get prescription |
| PUT | `/prescriptions/:id` | Update (Doctor) |
| POST | `/prescriptions/:id/refill` | Request refill |
| DELETE | `/prescriptions/:id` | Delete (Staff) |

---

## Insurance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/insurance` | Create/update insurance (Patient) |
| GET | `/insurance` | Get insurance (Patient) |
| DELETE | `/insurance` | Delete insurance (Patient) |

---

## Emergency Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/emergency-contacts` | Create contact (Patient) |
| GET | `/emergency-contacts` | List contacts (Patient) |
| GET | `/emergency-contacts/:id` | Get contact |
| PUT | `/emergency-contacts/:id` | Update (Patient) |
| DELETE | `/emergency-contacts/:id` | Delete (Patient) |

---

## Reminders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reminders` | Create reminder (Patient) |
| GET | `/reminders` | List reminders |
| GET | `/reminders/:id` | Get reminder |
| PUT | `/reminders/:id` | Update (Patient) |
| POST | `/reminders/:id/complete` | Mark complete (Patient) |
| DELETE | `/reminders/:id` | Delete (Patient) |

---

## Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/rooms` | Create chat room |
| GET | `/chat/rooms` | List chat rooms |
| GET | `/chat/rooms/:id` | Get chat room |
| GET | `/chat/rooms/:roomId/messages` | Get messages |
| POST | `/chat/rooms/:roomId/messages` | Send message |
| POST | `/chat/rooms/:roomId/read` | Mark as read |
| DELETE | `/chat/messages/:id` | Delete message |

---

## Queue
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/queue` | Add to queue |
| GET | `/queue` | Get queue |
| GET | `/queue/status` | Get queue status |
| POST | `/queue/next` | Call next patient (Doctor) |
| PUT | `/queue/:id` | Update queue entry (Receptionist) |
| POST | `/queue/:id/complete` | Complete entry (Receptionist) |
| DELETE | `/queue/:id` | Remove from queue |

---

## Health Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/health-analytics` | Create metric (Patient) |
| GET | `/health-analytics` | Get metrics |
| GET | `/health-analytics/:id` | Get metric |
| PUT | `/health-analytics/:id` | Update (Patient) |
| DELETE | `/health-analytics/:id` | Delete (Patient) |

---

## Telemedicine
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/telemedicine/:appointmentId` | Create session (Doctor) |
| GET | `/telemedicine/:appointmentId` | Get session |
| POST | `/telemedicine/:appointmentId/start` | Start session (Doctor) |
| POST | `/telemedicine/:appointmentId/end` | End session (Doctor) |

---

## Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reviews` | Create review (Patient) |
| GET | `/reviews` | List reviews |

---

## Data Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/data/export` | Export user data (Patient) |
| GET | `/data/exports` | Get export history (Patient) |
| DELETE | `/data/exports/:id` | Delete export (Patient) |

---

## Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/audit-logs` | Get audit logs |
| GET | `/admin/stats` | Get system stats |
| GET | `/admin/clinics` | Get all clinics |
| GET | `/admin/clinics/:id` | Get clinic details |

---

## Example Postman Setup

1. **Environment variables:**
   - `base_url`: `http://13.205.127.21:3001/api/v1`
   - `token`: Your Firebase ID token

2. **Request URL:** `{{base_url}}/api/v1/appointments`

3. **Headers:**
   - `Authorization`: `Bearer {{token}}`
   - `Content-Type`: `application/json`

4. **To get Firebase token:** Sign in via the PulseCal app, open browser DevTools → Network tab, inspect any API request, copy the `Authorization` header value.
