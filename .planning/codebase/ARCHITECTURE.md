# Architecture

**Analysis Date:** 2026-05-27

## Pattern Overview

**Overall:** Multi-client healthcare SaaS with a Flutter mobile app, a Next.js web app, and a shared Express/Prisma backend.

**Key Characteristics:**
- Mobile code in `pulsecalapp/lib` follows a layered Flutter structure: `core` infrastructure, `data` datasources/models/repositories, `domain` entities/interfaces, and `presentation` providers/screens/widgets.
- Web code in `app`, `components`, `services`, and `lib` follows Next.js App Router with client-side Redux auth state and Axios service wrappers.
- Backend code in `backend/src` follows an Express module pattern: route registration in `backend/src/routes.ts`, per-domain `*.routes.ts`, `*.controller.ts`, and `*.service.ts` files, and shared middleware in `backend/src/middlewares`.
- Both mobile and web authenticate with Firebase ID tokens and use the same backend/database identity records through `backend/src/middlewares/firebaseAuth.middleware.ts`.
- Backend persistence is Prisma/PostgreSQL from `backend/prisma/schema.prisma`; external auth identity is stored on `User.firebaseUid`.

## Layers

**Flutter App Bootstrap:**
- Purpose: Initialize local storage and external SDKs, then render the authenticated app shell.
- Location: `pulsecalapp/lib/main.dart`
- Contains: `Hive.initFlutter`, `Hive.openBox('pulsecal_storage')`, `FirebaseConfig.initialize`, `Supabase.initialize`, `ProviderScope`, and `PulseCalApp`.
- Depends on: `pulsecalapp/lib/core/config/firebase_config.dart`, `pulsecalapp/lib/core/config/supabase_config.dart`, `pulsecalapp/lib/presentation/providers/providers.dart`, `pulsecalapp/lib/presentation/screens/auth/auth_wrapper.dart`.
- Used by: All mobile screens through Riverpod providers and `AuthWrapper`.

**Flutter Core Infrastructure:**
- Purpose: Shared networking, config, storage keys, themes, errors, socket setup, and utility behavior.
- Location: `pulsecalapp/lib/core`
- Contains: `pulsecalapp/lib/core/network/dio_client.dart`, `pulsecalapp/lib/core/network/interceptors.dart`, `pulsecalapp/lib/core/config/app_config.dart`, `pulsecalapp/lib/core/socket/socket_service.dart`, `pulsecalapp/lib/core/constants/storage_keys.dart`.
- Depends on: Dio, Hive, Socket.IO client, Firebase/Supabase config.
- Used by: `pulsecalapp/lib/data/datasources/remote/api_service.dart` and all provider-driven backend calls.

**Flutter Data Layer:**
- Purpose: Convert backend/Firebase data into app models and coordinate remote/local persistence.
- Location: `pulsecalapp/lib/data`
- Contains: `pulsecalapp/lib/data/datasources/remote/api_service.dart`, `pulsecalapp/lib/data/datasources/remote/firebase_auth_remote_datasource.dart`, `pulsecalapp/lib/data/datasources/local/auth_local_datasource.dart`, `pulsecalapp/lib/data/repositories/auth_repository_impl.dart`, and models under `pulsecalapp/lib/data/models`.
- Depends on: `DioClient`, Firebase Auth, Google Sign-In, Hive, domain repository contracts.
- Used by: Riverpod providers in `pulsecalapp/lib/presentation/providers`.

**Flutter Domain Layer:**
- Purpose: Stable interfaces and entities independent of UI and transport details.
- Location: `pulsecalapp/lib/domain`
- Contains: `pulsecalapp/lib/domain/entities/user.dart`, `pulsecalapp/lib/domain/entities/clinic.dart`, `pulsecalapp/lib/domain/entities/doctor_profile.dart`, `pulsecalapp/lib/domain/repositories/auth_repository.dart`.
- Depends on: Equatable and plain Dart types.
- Used by: `pulsecalapp/lib/data/repositories/auth_repository_impl.dart`, `pulsecalapp/lib/presentation/providers/auth_provider.dart`, and `pulsecalapp/lib/presentation/screens/dashboard_router.dart`.

**Flutter Presentation Layer:**
- Purpose: Role-specific screens, navigation, widgets, and Riverpod state.
- Location: `pulsecalapp/lib/presentation`
- Contains: `pulsecalapp/lib/presentation/providers/auth_provider.dart`, `pulsecalapp/lib/presentation/providers/patient_providers.dart`, `pulsecalapp/lib/presentation/providers/doctor_providers.dart`, `pulsecalapp/lib/presentation/providers/receptionist_providers.dart`, role screen trees under `pulsecalapp/lib/presentation/screens/patient`, `pulsecalapp/lib/presentation/screens/doctor`, and `pulsecalapp/lib/presentation/screens/receptionist`.
- Depends on: `ApiService`, `AuthRepository`, Firebase current user, Flutter `Navigator`, Riverpod.
- Used by: `AuthWrapper` and role dashboards.

**Next.js Web App:**
- Purpose: Full website/dashboard implementation for patient, doctor, receptionist, and admin roles.
- Location: `app`, `components`, `services`, `lib`
- Contains: App Router routes in `app/(dashboard)`, admin routes in `app/admin`, auth routes in `app/auth`, Redux slices in `app/features`, dashboard pages in `components/pages/dashboard`, and API wrappers in `services`.
- Depends on: Firebase client auth in `lib/firebaseAuth.ts`, Redux store in `app/store.ts`, Axios `apiService` in `services/api.ts`.
- Used by: The production website and as the parity source for mobile feature coverage.

**Backend API Layer:**
- Purpose: Serve shared account, clinical, scheduling, payment, chat, queue, notification, and admin APIs.
- Location: `backend/src`
- Contains: Express bootstrap in `backend/src/app.ts` and `backend/src/server.ts`, route composition in `backend/src/routes.ts`, domain modules under `backend/src/modules`, Prisma DB config in `backend/src/config/database.ts`, Firebase auth in `backend/src/config/firebase.ts`.
- Depends on: Prisma, Firebase Admin, Express, Redis/Socket.IO, Razorpay.
- Used by: Mobile `DioClient`, web `services/api.ts`, and Socket.IO clients.

## Data Flow

**Mobile App Initialization:**

1. `pulsecalapp/lib/main.dart` calls `WidgetsFlutterBinding.ensureInitialized()`.
2. `Hive.initFlutter()` opens `pulsecal_storage` and injects the box through `storageProvider` in `pulsecalapp/lib/presentation/providers/providers.dart`.
3. Firebase initializes through `pulsecalapp/lib/core/config/firebase_config.dart`.
4. Supabase initializes through `pulsecalapp/lib/core/config/supabase_config.dart`, though primary application auth and backend APIs use Firebase plus Express.
5. `PulseCalApp` renders `MaterialApp` with `AuthWrapper` from `pulsecalapp/lib/presentation/screens/auth/auth_wrapper.dart`.

**Mobile API Client Flow:**

1. UI screens watch Riverpod providers such as `dashboardSummaryProvider`, `doctorDashboardSummaryProvider`, or `receptionistStatsProvider`.
2. Providers call `apiServiceProvider` in `pulsecalapp/lib/presentation/providers/providers.dart`.
3. `ApiService` in `pulsecalapp/lib/data/datasources/remote/api_service.dart` calls `DioClient` methods with paths relative to `AppConfig.baseUrl`.
4. `DioClient` in `pulsecalapp/lib/core/network/dio_client.dart` uses `AppConfig.baseUrl` from `pulsecalapp/lib/core/config/app_config.dart`, currently `http://13.205.127.21:3001/api/v1`.
5. `AuthInterceptor` in `pulsecalapp/lib/core/network/interceptors.dart` adds `Authorization: Bearer <access_token>` from Hive `StorageKeys.accessToken`.
6. Backend `authenticate` in `backend/src/middlewares/firebaseAuth.middleware.ts` verifies that token as a Firebase ID token and loads or creates the Prisma `User`.

**Web API Client Flow:**

1. Web screens call service wrappers in `services/*.ts`, usually via `services/api.ts`.
2. `services/api.ts` uses Axios with relative base URL `/api/v1`.
3. Next proxy routes in `app/api/v1/[...path]/route.ts` and `app/api/proxy/[...path]/route.ts` forward browser requests to the backend to avoid HTTPS-to-HTTP mixed content.
4. `services/api.ts` injects Firebase ID tokens from `lib/firebaseAuth.ts`.
5. Backend Firebase middleware in `backend/src/middlewares/firebaseAuth.middleware.ts` applies the same identity path as mobile.

**Auth and Session Handling:**

1. Mobile login/signup starts in `pulsecalapp/lib/presentation/providers/auth_provider.dart`.
2. `AuthNotifier` calls `AuthRepositoryImpl` in `pulsecalapp/lib/data/repositories/auth_repository_impl.dart`.
3. `AuthRepositoryImpl` delegates to `FirebaseAuthRemoteDataSource` in `pulsecalapp/lib/data/datasources/remote/firebase_auth_remote_datasource.dart`.
4. Firebase email/password or Google sign-in returns a Firebase user and ID token.
5. Existing-user login calls `ApiService.firebaseLogin`, which requests `GET /auth/profile`.
6. New-user signup calls `ApiService.syncProfile`, which requests `POST /auth/sync-profile`.
7. `AuthLocalDataSource` in `pulsecalapp/lib/data/datasources/local/auth_local_datasource.dart` stores the ID token as `access_token`, optional refresh token, serialized user data, user id, user role, and `is_logged_in` in Hive.
8. `AuthWrapper` reads `authProvider` and dispatches to doctor, receptionist, or patient dashboards.
9. Web auth uses `components/auth/AuthForm` through `app/auth/login/page.tsx` and `app/auth/signup/page.tsx`, Redux auth state in `app/features/authSlice.ts`, and Firebase token injection in `services/api.ts`.

**Role-Based Pages:**

1. Mobile `AuthWrapper` in `pulsecalapp/lib/presentation/screens/auth/auth_wrapper.dart` routes `doctor` to `DoctorDashboardScreen`, `receptionist` to `ReceptionistDashboardScreen`, and `patient` or unknown roles to `PatientDashboardScreen`.
2. Mobile `DashboardRouter` in `pulsecalapp/lib/presentation/screens/dashboard_router.dart` has the same patient/doctor/receptionist dispatch and no admin case.
3. Web `/dashboard` in `app/(dashboard)/dashboard/page.tsx` routes `patient`, `doctor`, `receptionist`, and `admin` to dedicated components in `components/pages/dashboard`.
4. Web protected route policy in `app/(dashboard)/layout.tsx` declares role route access for patient, doctor, receptionist, and admin, plus restricted subroutes such as `/dashboard/staff`, `/dashboard/schedule`, `/dashboard/analytics`, `/queue`, `/clinics`, and `/users`.

**Login Execution Path:**

1. Mobile user opens `LoginScreen` from `pulsecalapp/lib/presentation/screens/auth/login_screen.dart`.
2. `AuthNotifier.signInWithEmailPassword` in `pulsecalapp/lib/presentation/providers/auth_provider.dart` receives email, password, and selected role.
3. `FirebaseAuthRemoteDataSource.signInWithEmailPassword` authenticates with Firebase and obtains `user.getIdToken()`.
4. `ApiService.firebaseLogin` calls `GET /auth/profile`.
5. Backend route `backend/src/modules/auth/auth.routes.ts` maps `/auth/profile` to `getProfileController`.
6. Backend `authenticate` verifies Firebase token, resolves/creates `User`, and attaches `req.user`.
7. Backend `getProfile` in `backend/src/modules/users/users.service.ts` returns the canonical profile.
8. Mobile validates the returned role, persists user/session data in Hive, and `AuthWrapper` switches to the matching dashboard.

**Signup Execution Path:**

1. Mobile user opens `SignupScreen` from `pulsecalapp/lib/presentation/screens/auth/signup_screen.dart`.
2. `AuthNotifier.signUpWithEmailPassword` calls `AuthRepositoryImpl.signUpWithEmailPassword`.
3. `FirebaseAuthRemoteDataSource.signUpWithEmailPassword` blocks receptionist self-registration; receptionist accounts must be created by a doctor/admin path on web/backend.
4. Firebase creates the user and display name.
5. `ApiService.syncProfile` calls `POST /auth/sync-profile`.
6. Backend `syncProfileController` in `backend/src/modules/auth/auth.controller.ts` updates core user fields, sets role only while onboarding is incomplete, and ensures `DoctorProfile` or `PatientProfile` exists for doctor/patient roles.
7. Mobile stores the returned profile and routes through `AuthWrapper`.

**Dashboard Execution Paths:**

1. Patient mobile dashboard `pulsecalapp/lib/presentation/screens/patient/dashboard/patient_dashboard_screen.dart` watches `dashboardSummaryProvider`, `unreadNotificationsCountProvider`, and Firebase current user.
2. `dashboardSummaryProvider` in `pulsecalapp/lib/presentation/providers/patient_providers.dart` loads appointments, prescriptions, and reminders through `/appointments`, `/prescriptions`, and `/reminders`.
3. Doctor mobile dashboard `pulsecalapp/lib/presentation/screens/doctor/doctor_dashboard_screen.dart` watches `doctorDashboardSummaryProvider`, `doctorTodayAppointmentsProvider`, and `currentDoctorProfileProvider`.
4. Doctor providers in `pulsecalapp/lib/presentation/providers/doctor_providers.dart` load `/appointments`, `/doctor-profiles/user/:userId`, and `/queue/doctor/:doctorId` style paths.
5. Receptionist mobile dashboard `pulsecalapp/lib/presentation/screens/receptionist/receptionist_dashboard_screen.dart` uses appointment providers and queue/doctor profile providers; receptionist-specific providers in `pulsecalapp/lib/presentation/providers/receptionist_providers.dart` target `/receptionists/stats`, `/receptionists/doctors`, and `/receptionists/queue`.
6. Web dashboards use `app/(dashboard)/dashboard/page.tsx` plus `components/pages/dashboard/PatientDashboardPage.tsx`, `components/pages/dashboard/DoctorDashboardPage.tsx`, `components/pages/dashboard/ReceptionistDashboardPage.tsx`, and `components/pages/dashboard/AdminDashboardPage.tsx`.

**Payments Execution Path:**

1. Mobile payment and subscription calls live in `ApiService` in `pulsecalapp/lib/data/datasources/remote/api_service.dart`.
2. Patient/appointment payments call `/payments/create-order`, `/payments/verify`, and `/payments`.
3. Doctor subscription calls use `/doctors/subscription/create` and `/doctors/subscription/verify`.
4. Backend payment routes are split between legacy/standard `/api/v1/payments` in `backend/src/modules/payments/payments.routes.ts` and cleaner `/api/v1/payment-gateway` in `backend/src/modules/payment-gateway/payment-gateway.routes.ts`.
5. Web subscription and payment pages are under `app/(dashboard)/subscription/page.tsx` and `app/(dashboard)/services/payments/page.tsx`.

**State Management:**
- Mobile app state uses Riverpod providers and notifiers under `pulsecalapp/lib/presentation/providers`; durable auth state is Hive through `AuthLocalDataSource`.
- Web app state uses Redux Toolkit in `app/store.ts` with auth, appointments, and notifications slices in `app/features`.
- Backend state is PostgreSQL via Prisma schema `backend/prisma/schema.prisma`; realtime transient state uses Socket.IO/Redis setup in `backend/src/server.ts` and `backend/src/config/socket.ts`.

## Key Abstractions

**Mobile Auth Repository:**
- Purpose: Hide Firebase/backend/local storage mechanics behind domain auth methods.
- Examples: `pulsecalapp/lib/domain/repositories/auth_repository.dart`, `pulsecalapp/lib/data/repositories/auth_repository_impl.dart`.
- Pattern: Repository interface plus implementation returning `Either<Failure, T>`.

**Mobile Central API Service:**
- Purpose: Single client facade for backend endpoints used by mobile screens.
- Examples: `pulsecalapp/lib/data/datasources/remote/api_service.dart`, `pulsecalapp/lib/core/network/dio_client.dart`.
- Pattern: Riverpod-provided service around Dio with interceptors and typed model conversion.

**Mobile Role Dashboards:**
- Purpose: Role-specific primary shells and feature entry points.
- Examples: `pulsecalapp/lib/presentation/screens/patient/dashboard/patient_dashboard_screen.dart`, `pulsecalapp/lib/presentation/screens/doctor/doctor_dashboard_screen.dart`, `pulsecalapp/lib/presentation/screens/receptionist/receptionist_dashboard_screen.dart`.
- Pattern: `AuthWrapper` role switch plus per-role tab/bottom navigation screens.

**Web Role Dashboards:**
- Purpose: Complete role-specific website dashboard parity source.
- Examples: `components/pages/dashboard/PatientDashboardPage.tsx`, `components/pages/dashboard/DoctorDashboardPage.tsx`, `components/pages/dashboard/ReceptionistDashboardPage.tsx`, `components/pages/dashboard/AdminDashboardPage.tsx`.
- Pattern: Client-only dashboard dispatch from Redux auth user role.

**Backend Modules:**
- Purpose: Keep route/controller/service ownership by domain.
- Examples: `backend/src/modules/appointments`, `backend/src/modules/payments`, `backend/src/modules/doctors`, `backend/src/modules/receptionists`, `backend/src/modules/admin`.
- Pattern: Express Router per module composed under `/api/v1` in `backend/src/routes.ts`.

**Backend Data Models:**
- Purpose: Shared contract for mobile and web parity.
- Examples: `User`, `PatientProfile`, `DoctorProfile`, `Appointment`, `Payment`, `Prescription`, `MedicalRecord`, `Insurance`, `Clinic`, `ChatRoom`, `QueueEntry`, `Notification` in `backend/prisma/schema.prisma`.
- Pattern: Prisma models with role enums, status enums, soft-delete fields, and indexes.

## Entry Points

**Flutter Mobile App:**
- Location: `pulsecalapp/lib/main.dart`
- Triggers: Native app startup.
- Responsibilities: Initialize Hive, Firebase, Supabase, Riverpod overrides, Material theme, and `AuthWrapper`.

**Mobile Auth Shell:**
- Location: `pulsecalapp/lib/presentation/screens/auth/auth_wrapper.dart`
- Triggers: First rendered home screen after bootstrap and auth state changes.
- Responsibilities: Show splash during auth check, route authenticated users by role, and show login for unauthenticated users.

**Next.js Web App:**
- Location: `app/layout.tsx`, `app/providers.tsx`, `app/page.tsx`
- Triggers: Browser requests to the website.
- Responsibilities: Render public pages, inject global providers/styles, and host App Router pages.

**Web Dashboard Router:**
- Location: `app/(dashboard)/dashboard/page.tsx`
- Triggers: Authenticated browser route `/dashboard`.
- Responsibilities: Read Redux auth user and render patient/doctor/receptionist/admin dashboard component.

**Web Dashboard Guard:**
- Location: `app/(dashboard)/layout.tsx`
- Triggers: Any route under `app/(dashboard)`.
- Responsibilities: Auto-logout, require authentication, and enforce role-based route access.

**Express App:**
- Location: `backend/src/app.ts`
- Triggers: Node HTTP server created by `backend/src/server.ts`.
- Responsibilities: Security middleware, CORS, request logging, body parsing, health endpoint, API routes, static uploads, and error handlers.

**Express Server:**
- Location: `backend/src/server.ts`
- Triggers: Backend process startup.
- Responsibilities: Connect database, connect Redis, initialize Socket.IO, register chat/queue/notification sockets, and listen on configured port.

**Backend Route Composition:**
- Location: `backend/src/routes.ts`
- Triggers: Express API route matching.
- Responsibilities: Mount all modules under `/api/${config.apiVersion}`, including `/auth`, `/users`, `/appointments`, `/payments`, `/payment-gateway`, `/doctors`, `/doctor-profiles`, `/patient-profiles`, `/receptionists`, `/queue`, `/chat`, `/notifications`, and `/admin`.

## Error Handling

**Strategy:** Mobile converts Dio/backend failures into typed exceptions/failures; web lets Axios callers handle rejected requests after token refresh attempts; backend uses centralized Express error middleware and structured API responses.

**Patterns:**
- Mobile `ErrorInterceptor` in `pulsecalapp/lib/core/network/interceptors.dart` maps timeout, network, validation, unauthorized, not-found, and server errors to app exceptions.
- Mobile repository methods in `pulsecalapp/lib/data/repositories/auth_repository_impl.dart` convert exceptions into `AuthFailure`, `NetworkFailure`, `ServerFailure`, or `UnknownFailure`.
- Web `services/api.ts` retries 401 and 403 once after Firebase token refresh and logs network/HTTP errors.
- Backend controllers call `next(error)` and shared middleware in `backend/src/middlewares/error.middleware.ts`; successful responses use `sendSuccess` from `backend/src/utils/apiResponse.ts`.

## Cross-Cutting Concerns

**Logging:** Mobile uses `debugPrint` and `PrettyDioLogger` from `pulsecalapp/lib/core/network/dio_client.dart`; web logs API request/error details in `services/api.ts`; backend uses pino and console request logs in `backend/src/app.ts` plus `backend/src/utils/logger.ts`.

**Validation:** Mobile validates auth forms through UI/provider logic and typed model parsing in `pulsecalapp/lib/data/models`; backend applies route/controller validation and role checks in modules such as `backend/src/modules/auth/auth.controller.ts`, `backend/src/modules/users/users.routes.ts`, and `backend/src/middlewares/role.middleware.ts`.

**Authentication:** Firebase is the shared identity provider. Mobile obtains tokens in `pulsecalapp/lib/data/datasources/remote/firebase_auth_remote_datasource.dart`; web obtains tokens through `lib/firebaseAuth.ts`; backend verifies tokens in `backend/src/middlewares/firebaseAuth.middleware.ts`.

**Authorization:** Web has client-side route guards in `app/(dashboard)/layout.tsx`; backend enforces server-side role restrictions through `backend/src/middlewares/role.middleware.ts`; mobile currently only routes patient/doctor/receptionist dashboards client-side and relies on backend role middleware for API enforcement.

**Realtime:** Backend initializes Socket.IO in `backend/src/server.ts` and namespaces/events in `backend/src/socket`; mobile has `pulsecalapp/lib/core/socket/socket_service.dart`; web has `services/socket.ts`.

## Page Coverage vs Web App

**Patient Coverage:**
- Mobile implemented: dashboard, appointment search/booking, appointments list, medical records, prescriptions, insurance, consultations, profile, maps, health analytics, payment method/history, chat, notifications, settings under `pulsecalapp/lib/presentation/screens/patient`.
- Web implemented: appointments create/list/detail/cancel/checkin/directions/reschedule/chat, doctors map/book, health medical records, prescriptions, insurance, payments, maps, profile/security, notifications under `app/(dashboard)`.
- Parity gap: Mobile has no explicit equivalents for detailed appointment cancel/reschedule/check-in/directions pages in `app/(dashboard)/appointments/[id]`, profile security in `app/(dashboard)/profile/security/page.tsx`, and some web route-level detail screens.

**Doctor Coverage:**
- Mobile implemented: doctor dashboard, appointments tab, derived patients tab, profile tab, queue management, analytics, wallet, prescription writer, clinic settings, onboarding under `pulsecalapp/lib/presentation/screens/doctor`.
- Web implemented: dashboard staff/schedule/analytics/reports, patients, prescriptions, medical records, subscription, payments, doctor booking/profile surfaces under `app/(dashboard)`.
- Parity gap: Mobile doctor home wrapper contains placeholder appointments/chat/settings tabs in `pulsecalapp/lib/presentation/screens/doctor/home/doctor_home_wrapper.dart`; doctor profile screen tells users to complete profile on the web when missing in `pulsecalapp/lib/presentation/screens/doctor/doctor_dashboard_screen.dart`; working hours and services actions are TODOs.

**Receptionist Coverage:**
- Mobile implemented: receptionist dashboard, queue tab, walk-in registration, profile, doctors/patients/payments/settings screens under `pulsecalapp/lib/presentation/screens/receptionist`.
- Web implemented: receptionist dashboard through `components/pages/dashboard/ReceptionistDashboardPage.tsx`, appointments, patients, notifications, profile, and staff routes allowed by `app/(dashboard)/layout.tsx`.
- Parity gap: Mobile quick actions for walk-in, queue, patients, and schedule have empty `onTap` handlers in `pulsecalapp/lib/presentation/screens/receptionist/receptionist_dashboard_screen.dart`; profile updates and settings defer to web.

**Admin Coverage:**
- Mobile implemented: Not detected. `AuthWrapper` and `DashboardRouter` have no admin route.
- Web implemented: admin dashboard, analytics, clinics, clinic detail, reports, settings, users list/create/edit, doctor payouts, and admin login under `app/admin` plus admin dashboard rendering in `app/(dashboard)/dashboard/page.tsx`.
- Parity gap: Mobile has no admin shell, no admin dashboard, no admin routing, and no admin API providers.

## Backend Route Usage and Mismatches

**Shared Stable Routes:**
- Mobile and web can share `/api/v1/auth/profile`, `/api/v1/auth/sync-profile`, `/api/v1/users/profile`, `/api/v1/appointments`, `/api/v1/prescriptions`, `/api/v1/medical-records`, `/api/v1/payments`, `/api/v1/insurance`, `/api/v1/reminders`, `/api/v1/chat`, `/api/v1/notifications`, `/api/v1/doctors`, `/api/v1/doctor-profiles`, `/api/v1/receptionists`, and `/api/v1/queue` as mounted in `backend/src/routes.ts`.

**Mobile Endpoint Drift:**
- `pulsecalapp/lib/data/datasources/remote/api_service.dart` calls `/health-metrics`, but backend mounts health metric routes at `/health-analytics` in `backend/src/routes.ts` and `backend/src/modules/healthAnalytics/healthAnalytics.routes.ts`.
- `pulsecalapp/lib/data/datasources/remote/api_service.dart` calls `/queue/doctor/:doctorId`, `/queue/check-in`, and `/queue/position/:appointmentId`, but backend queue routes are `/queue`, `/queue/status`, `/queue/next`, `PUT /queue/:id`, `POST /queue/:id/complete`, and `DELETE /queue/:id` in `backend/src/modules/queue/queue.routes.ts`.
- `pulsecalapp/lib/data/datasources/remote/api_service.dart` calls `/doctor-profiles/user/:userId` and `/doctor-profiles/:id`, but backend doctor-profile routes are `/doctor-profiles`, `/doctor-profiles/me`, and `PUT /doctor-profiles/me` or `PUT /doctor-profiles` in `backend/src/modules/doctor-profiles/doctor-profiles.routes.ts`.
- `pulsecalapp/lib/data/datasources/remote/api_service.dart` calls `/specializations`, but no `/specializations` route is mounted in `backend/src/routes.ts`; the mobile method falls back to a local specialization list.
- `pulsecalapp/lib/core/constants/api_endpoints.dart` contains stale paths such as `/patients/dashboard`, `/patients/appointments`, `/records`, and `/appointments/book` that do not match current backend routes; prefer `ApiService` paths or update/remove this constants file.
- `pulsecalapp/lib/core/network/interceptors.dart` refreshes tokens through `/auth/refresh`, but backend auth routes only expose `/auth/profile` and `/auth/sync-profile` in `backend/src/modules/auth/auth.routes.ts`; Firebase token refresh should happen through Firebase SDK, as web does in `services/api.ts`.

---

*Architecture analysis: 2026-05-27*
