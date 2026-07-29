# Codebase Structure

**Analysis Date:** 2026-05-27

## Directory Layout

```text
pulsecal.web/
├── app/                    # Next.js App Router pages, dashboard routes, admin routes, API proxy routes
├── components/             # Shared React UI and page-level dashboard/auth/chat components
├── hooks/                  # React hooks such as mobile detection, toast, auto-logout
├── lib/                    # Web Firebase helpers, shared web utilities, domain/static data
├── services/               # Web API/socket service wrappers around backend routes
├── backend/                # Express/Prisma backend and deployment scripts
├── backend/src/            # TypeScript backend source: app, server, modules, middleware, config
├── backend/prisma/         # Prisma schema, migrations, and seed code
├── pulsecalapp/            # Flutter mobile application
├── pulsecalapp/lib/        # Flutter app source
├── pulsecalapp/android/    # Flutter Android host project
├── pulsecalapp/ios/        # Flutter iOS host project
└── .planning/codebase/     # GSD generated codebase reference documents
```

## Directory Purposes

**Mobile App Root:**
- Purpose: Native Flutter project for mobile parity.
- Contains: Flutter metadata, platform projects, assets, app source, tests, and pub manifests.
- Key files: `pulsecalapp/pubspec.yaml`, `pulsecalapp/lib/main.dart`, `pulsecalapp/analysis_options.yaml`, `pulsecalapp/test`.

**Mobile Core:**
- Purpose: Cross-cutting Flutter infrastructure used by every role flow.
- Contains: API base config, Firebase/Supabase config, Dio client, interceptors, socket service, theme, constants, errors, validators, helpers.
- Key files: `pulsecalapp/lib/core/config/app_config.dart`, `pulsecalapp/lib/core/network/dio_client.dart`, `pulsecalapp/lib/core/network/interceptors.dart`, `pulsecalapp/lib/core/constants/storage_keys.dart`, `pulsecalapp/lib/core/socket/socket_service.dart`.

**Mobile Data:**
- Purpose: Remote/local datasources, model parsing, and repository implementations.
- Contains: `datasources/local`, `datasources/remote`, `models`, `repositories`.
- Key files: `pulsecalapp/lib/data/datasources/remote/api_service.dart`, `pulsecalapp/lib/data/datasources/remote/firebase_auth_remote_datasource.dart`, `pulsecalapp/lib/data/datasources/local/auth_local_datasource.dart`, `pulsecalapp/lib/data/repositories/auth_repository_impl.dart`, `pulsecalapp/lib/data/models/user_model.dart`.

**Mobile Domain:**
- Purpose: App-level contracts and entities independent of Firebase/Dio/Flutter widgets.
- Contains: Repository interfaces and domain entities.
- Key files: `pulsecalapp/lib/domain/repositories/auth_repository.dart`, `pulsecalapp/lib/domain/entities/user.dart`, `pulsecalapp/lib/domain/entities/doctor_profile.dart`, `pulsecalapp/lib/domain/entities/clinic.dart`.

**Mobile Presentation:**
- Purpose: Riverpod providers, screens, and widgets.
- Contains: `providers`, `screens`, `widgets`.
- Key files: `pulsecalapp/lib/presentation/providers/providers.dart`, `pulsecalapp/lib/presentation/providers/auth_provider.dart`, `pulsecalapp/lib/presentation/screens/auth/auth_wrapper.dart`, `pulsecalapp/lib/presentation/screens/dashboard_router.dart`.

**Mobile Auth Screens:**
- Purpose: Login, signup, onboarding, role selection, and role-specific auth setup.
- Contains: General auth screens and doctor/patient/receptionist onboarding flows.
- Key files: `pulsecalapp/lib/presentation/screens/auth/login_screen.dart`, `pulsecalapp/lib/presentation/screens/auth/signup_screen.dart`, `pulsecalapp/lib/presentation/screens/auth/role_selection_screen.dart`, `pulsecalapp/lib/presentation/screens/auth/patient_onboarding_screen.dart`, `pulsecalapp/lib/presentation/screens/auth/receptionist_onboarding_screen.dart`, `pulsecalapp/lib/presentation/screens/auth/doctor/doctor_welcome_screen.dart`, `pulsecalapp/lib/presentation/screens/auth/doctor/create_clinic_flow.dart`, `pulsecalapp/lib/presentation/screens/auth/doctor/join_clinic_flow.dart`.

**Mobile Patient Screens:**
- Purpose: Patient-facing dashboard and healthcare workflows.
- Contains: Dashboard, home wrapper, appointments, booking, records, prescriptions, payments, insurance, map, health analytics, consultations, chat, profile, settings.
- Key files: `pulsecalapp/lib/presentation/screens/patient/dashboard/patient_dashboard_screen.dart`, `pulsecalapp/lib/presentation/screens/patient/home/patient_home_wrapper.dart`, `pulsecalapp/lib/presentation/screens/patient/booking/book_appointment_screen.dart`, `pulsecalapp/lib/presentation/screens/patient/appointments/appointments_screen.dart`, `pulsecalapp/lib/presentation/screens/patient/records/medical_records_screen.dart`, `pulsecalapp/lib/presentation/screens/patient/prescriptions/prescriptions_screen.dart`, `pulsecalapp/lib/presentation/screens/patient/payments/payment_history_screen.dart`.

**Mobile Doctor Screens:**
- Purpose: Doctor-facing dashboard, clinical work, queue, analytics, wallet, and clinic settings.
- Contains: Dashboard tabs, home wrapper, onboarding, queue, analytics, prescription writer, wallet, settings.
- Key files: `pulsecalapp/lib/presentation/screens/doctor/doctor_dashboard_screen.dart`, `pulsecalapp/lib/presentation/screens/doctor/home/doctor_home_wrapper.dart`, `pulsecalapp/lib/presentation/screens/doctor/queue/queue_management_screen.dart`, `pulsecalapp/lib/presentation/screens/doctor/analytics/doctor_analytics_screen.dart`, `pulsecalapp/lib/presentation/screens/doctor/prescription/prescription_writer_screen.dart`, `pulsecalapp/lib/presentation/screens/doctor/settings/clinic_settings_screen.dart`.

**Mobile Receptionist Screens:**
- Purpose: Receptionist dashboard, queue/walk-in operations, clinic doctors/patients/payments/settings.
- Contains: Main dashboard tabs and additional modular screens.
- Key files: `pulsecalapp/lib/presentation/screens/receptionist/receptionist_dashboard_screen.dart`, `pulsecalapp/lib/presentation/screens/receptionist/home/receptionist_home_wrapper.dart`, `pulsecalapp/lib/presentation/screens/receptionist/dashboard/register_patient_screen.dart`, `pulsecalapp/lib/presentation/screens/receptionist/doctors/receptionist_doctors_screen.dart`, `pulsecalapp/lib/presentation/screens/receptionist/patients/receptionist_patients_screen.dart`, `pulsecalapp/lib/presentation/screens/receptionist/payments/receptionist_payments_screen.dart`.

**Web App Routes:**
- Purpose: Website and dashboard route definitions.
- Contains: Public routes, auth routes, dashboard routes, admin routes, proxy routes, Redux store/slices.
- Key files: `app/page.tsx`, `app/layout.tsx`, `app/providers.tsx`, `app/auth/login/page.tsx`, `app/auth/signup/page.tsx`, `app/(dashboard)/layout.tsx`, `app/(dashboard)/dashboard/page.tsx`, `app/admin/page.tsx`, `app/api/v1/[...path]/route.ts`.

**Web Page Components:**
- Purpose: Client-side dashboard/auth/chat components rendered by routes.
- Contains: Role dashboard pages and auth/chat page components.
- Key files: `components/pages/dashboard/PatientDashboardPage.tsx`, `components/pages/dashboard/DoctorDashboardPage.tsx`, `components/pages/dashboard/ReceptionistDashboardPage.tsx`, `components/pages/dashboard/AdminDashboardPage.tsx`, `components/pages/auth/LoginPage.tsx`, `components/pages/auth/SignupPage.tsx`, `components/pages/chat/ChatRoomPage.tsx`.

**Web Services:**
- Purpose: Web-side API and realtime wrappers over backend routes.
- Contains: Axios base service and domain-specific services.
- Key files: `services/api.ts`, `services/auth.service.ts`, `services/appointment.service.ts`, `services/medicalRecord.service.ts`, `services/prescription.service.ts`, `services/chat.service.ts`, `services/socket.ts`, `services/user.service.ts`.

**Backend Source:**
- Purpose: Shared API for web and mobile.
- Contains: Express app/server, route composition, domain modules, middleware, socket handlers, jobs, utilities, config.
- Key files: `backend/src/app.ts`, `backend/src/server.ts`, `backend/src/routes.ts`, `backend/src/config/database.ts`, `backend/src/config/firebase.ts`, `backend/src/middlewares/firebaseAuth.middleware.ts`, `backend/src/middlewares/role.middleware.ts`.

**Backend Modules:**
- Purpose: Domain-owned API routes, controllers, and services.
- Contains: `admin`, `appointments`, `auth`, `chat`, `clinics`, `doctor-profiles`, `doctors`, `healthAnalytics`, `insurance`, `medicalRecords`, `notifications`, `patient-profiles`, `payment-gateway`, `payments`, `prescriptions`, `queue`, `receptionists`, `reminders`, `reviews`, `telemedicine`, `users`.
- Key files: `backend/src/modules/auth/auth.routes.ts`, `backend/src/modules/appointments/appointments.routes.ts`, `backend/src/modules/payments/payments.routes.ts`, `backend/src/modules/doctors/doctors.routes.ts`, `backend/src/modules/receptionists/receptionists.routes.ts`, `backend/src/modules/queue/queue.routes.ts`, `backend/src/modules/admin/admin.routes.ts`.

**Backend Data Model:**
- Purpose: Canonical database schema shared by mobile and web.
- Contains: Prisma datasource, enums, models, indexes, relations.
- Key files: `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`.

## Key File Locations

**Entry Points:**
- `pulsecalapp/lib/main.dart`: Mobile startup and SDK/storage initialization.
- `pulsecalapp/lib/presentation/screens/auth/auth_wrapper.dart`: Mobile authenticated role router.
- `app/page.tsx`: Web public entry route.
- `app/(dashboard)/dashboard/page.tsx`: Web authenticated role dashboard router.
- `app/(dashboard)/layout.tsx`: Web authenticated dashboard guard and role access policy.
- `backend/src/app.ts`: Express app setup.
- `backend/src/server.ts`: Backend HTTP/Socket.IO server startup.
- `backend/src/routes.ts`: Backend API route mount table.

**Configuration:**
- `pulsecalapp/pubspec.yaml`: Mobile dependencies, SDK version, and assets.
- `pulsecalapp/lib/core/config/app_config.dart`: Mobile backend base URL, socket URL, Razorpay key placeholder, Google Maps key placeholder, and app constants.
- `pulsecalapp/lib/core/config/firebase_config.dart`: Mobile Firebase initialization.
- `pulsecalapp/lib/core/config/supabase_config.dart`: Mobile Supabase initialization.
- `package.json`: Web Next.js dependencies and scripts.
- `backend/package.json`: Backend dependencies and scripts.
- `backend/src/config/env.ts`: Backend runtime environment parsing.
- `backend/src/config/database.ts`: Prisma database client.
- `backend/src/config/socket.ts`: Socket.IO initialization.
- `backend/ecosystem.config.js`: PM2 deployment config.

**Core Logic:**
- `pulsecalapp/lib/data/datasources/remote/api_service.dart`: Mobile backend endpoint facade.
- `pulsecalapp/lib/data/datasources/remote/firebase_auth_remote_datasource.dart`: Mobile Firebase login/signup/Google sign-in and backend sync.
- `pulsecalapp/lib/data/datasources/local/auth_local_datasource.dart`: Mobile Hive session persistence.
- `pulsecalapp/lib/presentation/providers/auth_provider.dart`: Mobile auth state notifier.
- `services/api.ts`: Web Axios backend client.
- `lib/firebaseAuth.ts`: Web Firebase token helper.
- `app/features/authSlice.ts`: Web auth state.
- `backend/src/middlewares/firebaseAuth.middleware.ts`: Backend Firebase token verification and Prisma user resolution.
- `backend/src/middlewares/role.middleware.ts`: Backend role middleware.
- `backend/src/modules/auth/auth.controller.ts`: Backend profile and sync-profile behavior.

**Role Screens:**
- `pulsecalapp/lib/presentation/screens/patient/dashboard/patient_dashboard_screen.dart`: Mobile patient dashboard.
- `pulsecalapp/lib/presentation/screens/doctor/doctor_dashboard_screen.dart`: Mobile doctor dashboard and tabs.
- `pulsecalapp/lib/presentation/screens/receptionist/receptionist_dashboard_screen.dart`: Mobile receptionist dashboard and tabs.
- `components/pages/dashboard/PatientDashboardPage.tsx`: Web patient dashboard.
- `components/pages/dashboard/DoctorDashboardPage.tsx`: Web doctor dashboard.
- `components/pages/dashboard/ReceptionistDashboardPage.tsx`: Web receptionist dashboard.
- `components/pages/dashboard/AdminDashboardPage.tsx`: Web admin dashboard.

**Backend Routes Used By Mobile Parity Work:**
- `backend/src/modules/auth/auth.routes.ts`: `/auth/profile`, `/auth/sync-profile`.
- `backend/src/modules/users/users.routes.ts`: `/users/profile`, staff/admin user management.
- `backend/src/modules/appointments/appointments.routes.ts`: appointment create/list/detail/update/reschedule/cancel/check-in/delete.
- `backend/src/modules/doctors/doctors.routes.ts`: doctor search, doctor detail, availability, slots, schedule, analytics, financial reports, clinic staff, subscription payment aliases.
- `backend/src/modules/doctor-profiles/doctor-profiles.routes.ts`: current doctor profile create/read/update.
- `backend/src/modules/receptionists/receptionists.routes.ts`: receptionist stats, queue, clinic doctors, patient registration.
- `backend/src/modules/payments/payments.routes.ts`: subscriptions, Razorpay orders, appointment payment, standard payments.
- `backend/src/modules/payment-gateway/payment-gateway.routes.ts`: clean payment order and verification routes.
- `backend/src/modules/queue/queue.routes.ts`: queue management.
- `backend/src/modules/healthAnalytics/healthAnalytics.routes.ts`: health metrics.
- `backend/src/modules/admin/admin.routes.ts`: admin APIs for web; mobile admin parity needs a new mobile provider/screen surface.

**Data Models:**
- `backend/prisma/schema.prisma`: Canonical server/database schema.
- `pulsecalapp/lib/data/models/user_model.dart`: Mobile user model.
- `pulsecalapp/lib/data/models/appointment_model.dart`: Mobile appointment and doctor profile model usage.
- `pulsecalapp/lib/data/models/payment_model.dart`: Mobile payment/order models.
- `pulsecalapp/lib/data/models/prescription_model.dart`: Mobile prescription/reminder models.
- `pulsecalapp/lib/data/models/medical_record_model.dart`: Mobile medical record model.
- `pulsecalapp/lib/data/models/chat_model.dart`: Mobile chat room/message models.
- `pulsecalapp/lib/data/models/insurance_model.dart`: Mobile insurance model.
- `pulsecalapp/lib/data/models/notification_model.dart`: Mobile notification model.
- `pulsecalapp/lib/data/models/health_metric_model.dart`: Mobile health metric/reminder models.

**Testing:**
- `pulsecalapp/test`: Flutter test directory.
- `backend/package.json`: Backend `npm test` runs Jest.
- Web package scripts in `package.json` expose `npm run lint`, `npm run build`, `npm run dev`, and `npm run start`; no test script is detected at root.

## Naming Conventions

**Files:**
- Flutter screen files use snake_case with role/feature suffixes: `patient_dashboard_screen.dart`, `doctor_dashboard_screen.dart`, `receptionist_dashboard_screen.dart`.
- Flutter provider files use snake_case plural/domain names: `patient_providers.dart`, `doctor_providers.dart`, `auth_provider.dart`.
- Flutter models use snake_case and `_model.dart`: `appointment_model.dart`, `payment_model.dart`, `user_model.dart`.
- Backend modules use lowercase/kebab-case directories and role-specific file suffixes: `appointments.routes.ts`, `appointments.controller.ts`, `appointments.service.ts`.
- Web App Router page files use Next.js conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, dynamic segments like `[id]`.
- Web page components use PascalCase: `PatientDashboardPage.tsx`, `LoginPage.tsx`, `ChatRoomPage.tsx`.

**Directories:**
- Add mobile role screens under `pulsecalapp/lib/presentation/screens/{patient|doctor|receptionist|admin}/feature`.
- Add mobile shared/common screens under `pulsecalapp/lib/presentation/screens/common`.
- Add backend domains under `backend/src/modules/<domain>`.
- Add web authenticated pages under `app/(dashboard)` unless admin-only, which belongs under `app/admin`.
- Add shared web services under `services`.

## Where to Add New Code

**Mobile API Parity:**
- Primary code: `pulsecalapp/lib/data/datasources/remote/api_service.dart`.
- Networking support: `pulsecalapp/lib/core/network/dio_client.dart`, `pulsecalapp/lib/core/network/interceptors.dart`, `pulsecalapp/lib/core/config/app_config.dart`.
- Models: `pulsecalapp/lib/data/models`.
- Providers: `pulsecalapp/lib/presentation/providers`.
- Screens: `pulsecalapp/lib/presentation/screens/{role}/{feature}`.

**Mobile Admin Role:**
- Primary code: create `pulsecalapp/lib/presentation/screens/admin`.
- Auth routing: update `pulsecalapp/lib/presentation/screens/auth/auth_wrapper.dart` and `pulsecalapp/lib/presentation/screens/dashboard_router.dart`.
- Providers: create `pulsecalapp/lib/presentation/providers/admin_providers.dart`.
- Backend calls: add admin methods to `pulsecalapp/lib/data/datasources/remote/api_service.dart`.
- Models: reuse `UserModel`, `DoctorProfileModel`, `PaymentModel`, and add admin-specific models under `pulsecalapp/lib/data/models` only when typed data shapes are stable.

**Mobile Patient Feature:**
- Primary code: `pulsecalapp/lib/presentation/screens/patient/<feature>`.
- State/API: `pulsecalapp/lib/presentation/providers/patient_providers.dart`.
- Existing examples: `pulsecalapp/lib/presentation/screens/patient/booking/book_appointment_screen.dart`, `pulsecalapp/lib/presentation/screens/patient/records/medical_records_screen.dart`.

**Mobile Doctor Feature:**
- Primary code: `pulsecalapp/lib/presentation/screens/doctor/<feature>`.
- State/API: `pulsecalapp/lib/presentation/providers/doctor_providers.dart`.
- Existing examples: `pulsecalapp/lib/presentation/screens/doctor/queue/queue_management_screen.dart`, `pulsecalapp/lib/presentation/screens/doctor/analytics/doctor_analytics_screen.dart`.

**Mobile Receptionist Feature:**
- Primary code: `pulsecalapp/lib/presentation/screens/receptionist/<feature>`.
- State/API: `pulsecalapp/lib/presentation/providers/receptionist_providers.dart`.
- Existing examples: `pulsecalapp/lib/presentation/screens/receptionist/dashboard/register_patient_screen.dart`, `pulsecalapp/lib/presentation/screens/receptionist/doctors/receptionist_doctors_screen.dart`.

**New Backend Endpoint:**
- Primary code: `backend/src/modules/<domain>/<domain>.routes.ts`, `backend/src/modules/<domain>/<domain>.controller.ts`, `backend/src/modules/<domain>/<domain>.service.ts`.
- Route registration: `backend/src/routes.ts`.
- Auth/roles: `backend/src/middlewares/firebaseAuth.middleware.ts`, `backend/src/middlewares/role.middleware.ts`.
- Data model changes: `backend/prisma/schema.prisma` plus migration.

**Web Route Parity Reference:**
- Patient routes: `app/(dashboard)/appointments`, `app/(dashboard)/health`, `app/(dashboard)/services`, `app/(dashboard)/profile`, `app/(dashboard)/notifications`, `app/(dashboard)/doctors`.
- Doctor routes: `app/(dashboard)/dashboard/staff`, `app/(dashboard)/dashboard/schedule`, `app/(dashboard)/dashboard/analytics`, `app/(dashboard)/dashboard/reports`, `app/(dashboard)/patients`, `app/(dashboard)/subscription`.
- Receptionist routes: `app/(dashboard)/appointments`, `app/(dashboard)/patients`, `app/(dashboard)/notifications`, `app/(dashboard)/profile`.
- Admin routes: `app/admin/dashboard`, `app/admin/users`, `app/admin/clinics`, `app/admin/analytics`, `app/admin/reports`, `app/admin/settings`, `app/admin/doctors/payouts`.

**Utilities:**
- Mobile shared UI widgets: `pulsecalapp/lib/presentation/widgets`.
- Mobile validators/helpers: `pulsecalapp/lib/core/utils`.
- Web shared UI: `components/ui` and `components/common`.
- Web utilities: `lib`.
- Backend utilities: `backend/src/utils`.

## Special Directories

**`pulsecalapp/build`:**
- Purpose: Flutter generated build outputs.
- Generated: Yes.
- Committed: Should not be used as source for parity work.

**`pulsecalapp/.dart_tool`:**
- Purpose: Flutter/Dart tool cache.
- Generated: Yes.
- Committed: No source changes should be made here.

**`backend/prisma`:**
- Purpose: Database schema, migrations, seed data.
- Generated: Partially; schema and migrations are source, Prisma client is generated elsewhere.
- Committed: Schema/migrations should be committed when changed.

**`app/api/v1/[...path]`:**
- Purpose: Next.js API proxy for web browser calls to backend `/api/v1`.
- Generated: No.
- Committed: Yes.

**`backend/uploads`:**
- Purpose: Runtime upload storage served by `backend/src/app.ts`.
- Generated: Yes at runtime.
- Committed: Usually no for uploaded user files.

**`.planning/codebase`:**
- Purpose: GSD generated architecture/reference documents for future planning and execution.
- Generated: Yes.
- Committed: Depends on workflow, but documents are source-like planning artifacts.

## Critical Blockers For Mobile Parity

**Admin Mobile Surface Missing:**
- Files: `pulsecalapp/lib/presentation/screens/auth/auth_wrapper.dart`, `pulsecalapp/lib/presentation/screens/dashboard_router.dart`, `app/admin`.
- Blocker: Web supports admin dashboards and management routes, but mobile has no admin route, screen tree, provider, or API facade.
- Fix location: Add `pulsecalapp/lib/presentation/screens/admin`, `pulsecalapp/lib/presentation/providers/admin_providers.dart`, and update mobile auth routing.

**Mobile API Route Drift:**
- Files: `pulsecalapp/lib/data/datasources/remote/api_service.dart`, `pulsecalapp/lib/core/constants/api_endpoints.dart`, `backend/src/routes.ts`, `backend/src/modules/queue/queue.routes.ts`, `backend/src/modules/healthAnalytics/healthAnalytics.routes.ts`, `backend/src/modules/doctor-profiles/doctor-profiles.routes.ts`.
- Blocker: Several mobile calls do not match current backend route mounts.
- Fix location: Normalize mobile `ApiService` paths to current backend routes or add backend compatibility routes intentionally.

**Mobile Token Refresh Mismatch:**
- Files: `pulsecalapp/lib/core/network/interceptors.dart`, `backend/src/modules/auth/auth.routes.ts`, `services/api.ts`.
- Blocker: Mobile attempts `/auth/refresh`, but backend does not expose it and the shared auth model is Firebase ID-token refresh.
- Fix location: Replace mobile refresh flow with Firebase `getIdToken(true)`-style token refresh or add a deliberate backend refresh endpoint if switching auth models.

**Doctor Profile Lookup Mismatch:**
- Files: `pulsecalapp/lib/data/datasources/remote/api_service.dart`, `pulsecalapp/lib/presentation/providers/doctor_providers.dart`, `backend/src/modules/doctor-profiles/doctor-profiles.routes.ts`.
- Blocker: Mobile asks for `/doctor-profiles/user/:userId`, while backend exposes `/doctor-profiles/me`.
- Fix location: Update `currentDoctorProfileProvider` and `ApiService.getDoctorProfileByUserId` to use `/doctor-profiles/me`, or add a backend route for user-id lookup.

**Role Flow Incompleteness:**
- Files: `pulsecalapp/lib/presentation/screens/doctor/home/doctor_home_wrapper.dart`, `pulsecalapp/lib/presentation/screens/doctor/doctor_dashboard_screen.dart`, `pulsecalapp/lib/presentation/screens/receptionist/receptionist_dashboard_screen.dart`.
- Blocker: Several mobile tabs/actions are placeholders or defer profile/settings completion to web.
- Fix location: Implement the placeholder tabs/actions and wire them to existing providers/backend endpoints.

---

*Structure analysis: 2026-05-27*
