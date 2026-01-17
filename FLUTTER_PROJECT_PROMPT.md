# PulseCal - Complete Flutter Mobile Application Project Prompt

## Project Overview

Build **PulseCal**, a production-ready healthcare appointment and clinic management mobile application in Flutter. The app connects to an existing Node.js/Express backend hosted on AWS EC2 with PostgreSQL database (via Prisma ORM). The backend API is available at `http://13.205.127.21:3001/api/v1`.

---

## Technology Stack

### Frontend (Flutter)
- **Framework**: Flutter 3.x (latest stable)
- **State Management**: Riverpod 2.x
- **Navigation**: GoRouter
- **HTTP Client**: Dio
- **Local Storage**: SharedPreferences + FlutterSecureStorage (for tokens)
- **Real-time**: Socket.IO Client (socket_io_client)
- **Authentication**: Firebase Auth (email/password + Google Sign-In + Phone OTP)
- **Payments**: Razorpay Flutter SDK
- **Maps**: Google Maps Flutter
- **Video Calls**: Agora RTC (for telemedicine)
- **Push Notifications**: Firebase Cloud Messaging
- **Image Handling**: cached_network_image, image_picker

### Backend (Already Built - Connect to existing)
- **Server**: Node.js + Express.js on AWS EC2
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Firebase Authentication
- **Real-time**: Socket.IO
- **Payments**: Razorpay

---

## User Roles

1. **PATIENT** - Book appointments, view medical records, chat with doctors
2. **DOCTOR** - Manage appointments, write prescriptions, view analytics
3. **RECEPTIONIST** - Manage clinic queue, check-in patients
4. **ADMIN** - Full system access, manage users, clinics, analytics

---

## Core Features to Implement

### 1. Authentication Module
```
Screens:
├── SplashScreen (auto-login check)
├── WelcomeScreen (role selection: Patient/Doctor)
├── LoginScreen
│   ├── Email/Password login
│   ├── Google Sign-In button
│   └── Phone OTP login (India focus)
├── SignupScreen  
│   ├── Full name, email, password
│   ├── Google Sign-Up
│   └── Phone registration with OTP
├── ForgotPasswordScreen
└── EmailVerificationScreen
```

**API Endpoints:**
- `POST /auth/firebase-login` - Login with Firebase token
- `GET /auth/profile` - Get current user profile
- `POST /auth/sync-profile` - Sync Firebase user with backend

---

### 2. Onboarding Module

#### Patient Onboarding
```
Screens:
├── PersonalInfoScreen (name, DOB, phone, gender)
├── HealthProfileScreen (blood type, allergies, chronic conditions)
├── EmergencyContactScreen
└── InsuranceInfoScreen (optional)
```

#### Doctor Onboarding (7 steps)
```
Screens:
├── ClinicModeSelectionScreen (Join existing / Create new)
├── PersonalInfoScreen (license number, specialization, qualifications)
├── ClinicSearchScreen (for joining existing clinic)
├── ClinicCreationScreen (name, address, coordinates via Google Maps)
├── ServicesScreen (consultation fee, services offered)
├── WorkingHoursScreen (weekly schedule)
├── SubscriptionPlanScreen (TEST ₹1, BASIC ₹1499, PRO ₹2999, ENTERPRISE ₹4999)
└── PaymentScreen (Razorpay integration)
```

**API Endpoints:**
- `POST /doctor-profiles` - Create doctor profile
- `PUT /users/profile` - Update user profile
- `POST /doctors/subscription/create` - Create Razorpay order
- `POST /doctors/subscription/verify` - Verify payment & create clinic

---

### 3. Patient Dashboard
```
Screens:
├── HomeScreen
│   ├── Quick stats (upcoming appointments, active prescriptions)
│   ├── Quick action buttons (Book, Records, Chat)
│   └── Today's reminders
├── AppointmentsScreen
│   ├── Upcoming tab
│   ├── Past tab
│   └── Cancelled tab
├── BookAppointmentScreen
│   ├── Doctor search with filters (specialization, location, fee)
│   ├── Doctor profile view
│   ├── Date/time slot selection
│   └── Confirmation & payment
├── MedicalRecordsScreen
│   ├── Records list with filters
│   └── Record detail view (with file attachments)
├── PrescriptionsScreen
│   ├── Active prescriptions
│   └── Prescription history
├── HealthScreen
│   ├── Health analytics charts
│   ├── Vitals logging (BP, weight, glucose)
│   └── Reminders management
├── PaymentsScreen
│   ├── Payment history
│   └── Invoice download
├── ChatScreen
│   ├── Chat list
│   └── Chat room (real-time with Socket.IO)
└── ProfileScreen
    ├── Personal info
    ├── Emergency contacts
    ├── Insurance info
    └── Settings
```

---

### 4. Doctor Dashboard
```
Screens:
├── DoctorHomeScreen
│   ├── Today's appointments list
│   ├── Quick stats (patients today, earnings, pending)
│   └── Notifications
├── AppointmentManagementScreen
│   ├── Calendar view
│   ├── List view with filters
│   └── Appointment actions (confirm, start, complete, cancel)
├── PatientConsultationScreen
│   ├── Patient details & history
│   ├── Write diagnosis
│   ├── Create prescription
│   └── Add medical records
├── PrescriptionWriterScreen
│   ├── Medication search
│   ├── Dosage, frequency, instructions
│   └── Digital prescription generation
├── AnalyticsScreen
│   ├── Revenue charts
│   ├── Patient statistics
│   └── Appointment trends
├── ClinicSettingsScreen
│   ├── Working hours management
│   ├── Services & fees
│   └── Clinic profile
├── QueueManagementScreen
│   ├── Live queue view
│   └── Call next patient
└── TelemedicineScreen
    ├── Active sessions
    └── Video call (Agora integration)
```

---

### 5. Real-time Features
- **Live Queue Updates**: Patients see their position in real-time
- **Chat Messaging**: Instant messaging between patients and doctors
- **Appointment Notifications**: Status changes pushed in real-time
- **Payment Confirmations**: Instant payment status updates

**Socket Events to Handle:**
```dart
// Listen events
socket.on('queue:update', handler);
socket.on('chat:message', handler);
socket.on('appointment:updated', handler);
socket.on('payment:status', handler);
socket.on('notification', handler);
```

---

### 6. Maps & Location
- **Doctor Search by Location**: Find nearby doctors using coordinates
- **Clinic Location**: Show clinic on map with directions
- **Geocoding**: Address to coordinates conversion for clinic registration

---

### 7. Payment Integration (Razorpay)
```dart
// Payment flow:
1. Call POST /payments/create-order with plan/amount
2. Receive orderId, key, amount
3. Open Razorpay checkout
4. On success: POST /payments/verify with payment response
5. Handle success/failure UI
```

---

## API Service Layer

Create a centralized API service:

```dart
class ApiService {
  final Dio _dio;
  
  // Auth
  Future<User> firebaseLogin(String idToken);
  Future<User> getProfile();
  
  // Appointments
  Future<List<Appointment>> getAppointments({status, page, limit});
  Future<Appointment> createAppointment(data);
  Future<Appointment> updateAppointment(id, data);
  Future<void> cancelAppointment(id, reason);
  
  // Doctors
  Future<List<Doctor>> searchDoctors({specialization, city, lat, lng});
  Future<Doctor> getDoctorById(id);
  Future<Availability> getDoctorAvailability(id, date);
  
  // Medical Records
  Future<List<MedicalRecord>> getMedicalRecords({page, limit});
  Future<MedicalRecord> createMedicalRecord(data);
  
  // Prescriptions
  Future<List<Prescription>> getPrescriptions({status});
  Future<Prescription> createPrescription(data);
  
  // Payments
  Future<RazorpayOrder> createPaymentOrder(plan);
  Future<void> verifyPayment(data);
  Future<List<Payment>> getPayments();
  
  // Chat
  Future<List<ChatRoom>> getChatRooms();
  Future<List<Message>> getMessages(roomId);
  Future<Message> sendMessage(roomId, content);
  
  // Health Analytics
  Future<List<HealthMetric>> getHealthMetrics();
  Future<void> logHealthMetric(type, value);
  
  // Reminders
  Future<List<Reminder>> getReminders();
  Future<Reminder> createReminder(data);
  
  // Queue
  Future<QueueStatus> getQueueStatus(doctorId);
  Future<void> checkIn(appointmentId);
}
```

---

## Data Models

```dart
class User {
  String id, email, firstName, lastName, phone;
  String role; // PATIENT, DOCTOR, RECEPTIONIST, ADMIN
  String? profileImage;
  bool onboardingCompleted;
  DoctorProfile? doctorProfile;
  PatientProfile? patientProfile;
}

class Appointment {
  String id, patientId, doctorId;
  DateTime scheduledAt;
  int duration;
  String status; // SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
  String? reason, notes, diagnosis;
  User? patient, doctor;
}

class Doctor {
  String id, licenseNumber, specialization;
  String? qualifications, bio, clinicName, clinicAddress;
  double consultationFee;
  int? yearsOfExperience;
  List<String> services;
  Map<String, dynamic>? workingHours;
  User user;
}

class MedicalRecord {
  String id, patientId, recordType, title;
  String? description, diagnosis, treatment, fileUrl;
  DateTime recordDate;
}

class Prescription {
  String id, patientId, doctorId;
  String medicationName, dosage, frequency;
  int quantity, refills;
  String? instructions, status;
  DateTime prescribedAt;
}

class Payment {
  String id, patientId;
  double amount;
  String currency, status, method;
  String? transactionId, razorpayOrderId;
  DateTime? paidAt;
}

class ChatMessage {
  String id, roomId, senderId, content;
  String type; // TEXT, IMAGE, FILE
  bool isRead;
  DateTime createdAt;
}

class HealthMetric {
  String id, patientId, metricType;
  double value;
  String? unit;
  DateTime recordedAt;
}
```

---

## UI/UX Requirements

### Design System
- **Theme**: Dark glassmorphism with medical aesthetic
- **Primary Color**: #0F172A (Deep navy)
- **Accent Color**: #3B82F6 (Blue)
- **Success**: #22C55E (Green)
- **Error**: #EF4444 (Red)
- **Typography**: Inter or Roboto font family

### Navigation Structure
```
Patient App:
├── BottomNavigationBar
│   ├── Home
│   ├── Appointments
│   ├── Health
│   ├── Chat
│   └── Profile

Doctor App:
├── BottomNavigationBar
│   ├── Dashboard
│   ├── Appointments
│   ├── Patients
│   ├── Analytics
│   └── Settings
```

### Key UI Components
- Animated appointment cards with status indicators
- Pull-to-refresh on all list screens
- Shimmer loading states
- Empty state illustrations
- Toast/Snackbar notifications
- Modal bottom sheets for quick actions
- Swipe-to-action on list items

---

## Project Structure

```
lib/
├── main.dart
├── app.dart
├── config/
│   ├── theme.dart
│   ├── routes.dart
│   └── constants.dart
├── core/
│   ├── api/
│   │   ├── api_service.dart
│   │   ├── api_client.dart
│   │   └── interceptors/
│   ├── auth/
│   │   ├── auth_service.dart
│   │   └── firebase_auth_service.dart
│   ├── socket/
│   │   └── socket_service.dart
│   └── storage/
│       └── secure_storage.dart
├── models/
│   ├── user.dart
│   ├── appointment.dart
│   ├── doctor.dart
│   ├── prescription.dart
│   ├── medical_record.dart
│   ├── payment.dart
│   ├── chat.dart
│   └── health_metric.dart
├── providers/
│   ├── auth_provider.dart
│   ├── appointments_provider.dart
│   ├── doctors_provider.dart
│   ├── chat_provider.dart
│   └── health_provider.dart
├── features/
│   ├── auth/
│   ├── onboarding/
│   ├── patient/
│   ├── doctor/
│   └── shared/
└── widgets/
    ├── common/
    ├── cards/
    ├── forms/
    └── charts/
```

---

## Environment Configuration

```dart
// lib/config/constants.dart
class AppConfig {
  static const String apiBaseUrl = 'http://13.205.127.21:3001/api/v1';
  static const String socketUrl = 'http://13.205.127.21:3001';
  static const String razorpayKeyId = 'YOUR_RAZORPAY_KEY';
  static const String googleMapsApiKey = 'YOUR_GOOGLE_MAPS_KEY';
}
```

---

## Firebase Configuration

Required Firebase services:
1. **Authentication** - Email/Password, Google, Phone
2. **Cloud Messaging** - Push notifications
3. **Crashlytics** - Error reporting (optional)

---

## Build Commands

```bash
# Development
flutter run

# Release APK
flutter build apk --release

# Release iOS
flutter build ios --release

# App Bundle for Play Store
flutter build appbundle --release
```

---

## Key Packages (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.4.0
  go_router: ^12.0.0
  dio: ^5.3.0
  firebase_core: ^2.24.0
  firebase_auth: ^4.15.0
  google_sign_in: ^6.1.0
  socket_io_client: ^2.0.0
  razorpay_flutter: ^1.3.0
  google_maps_flutter: ^2.5.0
  geolocator: ^10.0.0
  geocoding: ^2.1.0
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.0
  cached_network_image: ^3.3.0
  image_picker: ^1.0.0
  fl_chart: ^0.65.0
  intl: ^0.18.0
  shimmer: ^3.0.0
  lottie: ^2.6.0
  url_launcher: ^6.2.0
  permission_handler: ^11.0.0
```

---

## Priority Implementation Order

1. **Phase 1 - Core Auth** (Week 1)
   - Project setup with architecture
   - Firebase integration
   - Login/Signup screens
   - API service layer

2. **Phase 2 - Patient Features** (Week 2-3)
   - Patient dashboard
   - Doctor search & booking
   - Appointments management
   - Medical records view

3. **Phase 3 - Doctor Features** (Week 3-4)
   - Doctor onboarding with payment
   - Doctor dashboard
   - Appointment management
   - Prescription writing

4. **Phase 4 - Real-time & Polish** (Week 5)
   - Socket.IO integration
   - Chat system
   - Push notifications
   - UI polish & animations

5. **Phase 5 - Testing & Launch** (Week 6)
   - Integration testing
   - Performance optimization
   - App store assets
   - Deployment

---

## Success Criteria

- [ ] All authentication methods work (email, Google, phone)
- [ ] Patients can search and book appointments with doctors
- [ ] Razorpay payments process successfully
- [ ] Real-time queue updates work via Socket.IO
- [ ] Chat messages deliver instantly
- [ ] Doctors can write and save prescriptions
- [ ] Medical records display with attachments
- [ ] Push notifications arrive for appointments
- [ ] App works offline with cached data
- [ ] Both Android APK and iOS IPA build successfully
