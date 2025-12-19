# Real-Time Backend Features Documentation

## Overview
This backend server provides real-time data synchronization for the PulseCal healthcare platform, supporting doctors, patients, and receptionists with live updates for appointments, payments, and analytics.

## Real-Time Features

### 1. Socket.IO Integration
- **Namespace**: `/notifications`
- **Authentication**: Firebase token-based authentication
- **Auto-subscription**: Users are automatically subscribed to their notification room on connection

### 2. Real-Time Events

#### Appointment Events
- **`appointment:new`**: Emitted to doctor when a new appointment is booked
  ```json
  {
    "appointmentId": "uuid",
    "patientName": "John Doe",
    "scheduledAt": "2024-12-20T10:00:00Z",
    "reason": "General checkup"
  }
  ```

- **`appointment:update`**: Emitted to both doctor and patient when appointment status changes
  ```json
  {
    "appointmentId": "uuid",
    "status": "CONFIRMED",
    "scheduledAt": "2024-12-20T10:00:00Z"
  }
  ```

#### Payment Events
- **`payment:update`**: Emitted to doctor when payment status changes
  ```json
  {
    "paymentId": "uuid",
    "appointmentId": "uuid",
    "amount": 150.00,
    "status": "COMPLETED"
  }
  ```

#### Doctor Events
- **`doctor:new`**: Broadcasted when a new doctor registers (for nearby patients)
  ```json
  {
    "doctorId": "uuid",
    "city": "New York"
  }
  ```

## API Endpoints

### Doctor Search & Discovery
- **GET** `/api/v1/doctors/search`
  - Query params:
    - `latitude` (number): User's latitude
    - `longitude` (number): User's longitude
    - `radius` (number, default: 10): Search radius in kilometers
    - `specialization` (string): Filter by specialization
    - `name` (string): Search by doctor name
    - `clinicName` (string): Search by clinic name
    - `minFee` (number): Minimum consultation fee
    - `maxFee` (number): Maximum consultation fee
    - `city` (string): Filter by city
    - `page` (number): Page number
    - `limit` (number): Results per page

- **GET** `/api/v1/doctors/:id`
  - Get doctor profile by ID

- **GET** `/api/v1/doctors/:id/availability`
  - Query params:
    - `date` (ISO string): Date to check availability
  - Returns available time slots for the specified date

### Doctor Analytics
- **GET** `/api/v1/doctors/analytics`
  - Query params:
    - `period` (string): `day` | `week` | `month` | `3months` | `year`
  - Returns:
    - Summary metrics (appointments, revenue, cancellation rate)
    - Revenue trends
    - Appointment trends
    - Patient growth

### Receptionist Dashboard
- **GET** `/api/v1/receptionists/stats`
  - Returns today's appointment statistics:
    - Total booked
    - Completed
    - Waiting
    - In progress
    - Cancelled
    - No show
    - List of all appointments

- **GET** `/api/v1/receptionists/queue`
  - Query params:
    - `clinicId` (string, optional): Filter by clinic
  - Returns current queue status

- **POST** `/api/v1/receptionists`
  - Body:
    - `clinicId` (string): Clinic to link to
    - `verificationCode` (string, optional): Verification code

## Real-Time Data Flow

### Appointment Booking Flow
1. Patient books appointment via `POST /api/v1/appointments`
2. Backend creates appointment in database
3. Socket.IO emits `appointment:new` to doctor
4. Doctor receives real-time notification
5. Doctor can accept/reject via `PUT /api/v1/appointments/:id`

### Payment Processing Flow
1. Payment created via `POST /api/v1/payments`
2. Payment status updated via `PUT /api/v1/payments/:id/status`
3. Socket.IO emits `payment:update` to doctor
4. Doctor's dashboard updates in real-time
5. Analytics recalculated automatically

### Doctor Registration Flow
1. Doctor completes onboarding
2. Doctor profile created with location data
3. Socket.IO broadcasts `doctor:new` to patients in same city
4. Patients see new doctor in their discovery map

## Database Schema Updates

### DoctorProfile
- `clinicLatitude` (Float): For location-based search
- `clinicLongitude` (Float): For location-based search
- `clinicName` (String): Clinic name
- `clinicAddress` (String): Full address
- `services` (String[]): Array of services offered
- `workingHours` (JSON): Weekly schedule

### Payment
- `appointmentId` (String, optional): Linked appointment
- `status` (Enum): PENDING, COMPLETED, FAILED, REFUNDED
- `paidAt` (DateTime): Timestamp when payment completed

## AWS Deployment

### Environment Variables
```bash
DATABASE_URL=postgresql://...
REDIS_HOST=...
REDIS_PORT=...
FIREBASE_PROJECT_ID=...
CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production
PORT=3000
```

### Running on AWS
1. Build TypeScript: `npm run build`
2. Start server: `npm start` or `npm run start:prod`
3. Server runs on port specified in `PORT` env var

### Health Check
- **GET** `/health` - Returns server status

## Performance Considerations

1. **Location Search**: Uses Haversine formula for distance calculation. For production, consider using PostGIS for better performance.
2. **Real-Time Updates**: Uses Socket.IO with Redis adapter for horizontal scaling
3. **Analytics**: Calculated on-demand. Consider caching for frequently accessed periods.
4. **Database Indexes**: Ensure indexes on `clinicLatitude`, `clinicLongitude`, `scheduledAt`, `status` for optimal performance

## Security

- All endpoints require Firebase authentication
- Role-based access control (RBAC) enforced
- Socket.IO connections authenticated via Firebase tokens
- Sensitive data encrypted (payment card data)

## Testing Real-Time Features

### Using Socket.IO Client
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/notifications', {
  auth: {
    token: 'your-firebase-token'
  }
});

socket.on('appointment:new', (data) => {
  console.log('New appointment:', data);
});

socket.on('payment:update', (data) => {
  console.log('Payment update:', data);
});
```

## Future Enhancements

1. Redis pub/sub for multi-server deployments
2. Webhook support for external integrations
3. GraphQL subscription support
4. Real-time queue management
5. Live chat between doctor and patient
6. Telemedicine session management

