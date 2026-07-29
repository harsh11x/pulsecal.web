# Codebase Concerns

**Analysis Date:** 2026-05-27

## Executive Priority

**P0 - Establish mobile app baseline and API contract:**
- Issue: `pulsecalapp/` exists but contains no source files, manifests, Expo config, native project, services, screens, or package metadata.
- Files: `pulsecalapp/`, `package.json`, `backend/src/routes.ts`, `services/api.ts`
- Impact: There is no mobile app implementation to connect to the AWS backend/database/accounts/auth/payments. Parity work starts with creating the mobile app shell, shared API client, auth session handling, role routing, and a screen map based on the website.
- Fix approach: Create an Expo or React Native app under `pulsecalapp/` with Firebase Auth, secure token storage, backend base URL config, Razorpay mobile SDK/web checkout strategy, role-based navigation, and screen coverage for patient, doctor, receptionist, and admin workflows.

**P0 - Remove website-only proxy assumption before mobile integration:**
- Issue: The website API client uses a relative Next.js proxy path and cannot be reused by a native app.
- Files: `services/api.ts`, `app/api/v1/[...path]/route.ts`, `app/api/proxy/[...path]/route.ts`
- Impact: Mobile cannot call `/api/v1` relative to the Next app. It needs a direct HTTPS backend URL and must send Firebase ID tokens directly to `https://<backend>/api/v1/*`.
- Fix approach: Define a platform-neutral API contract and create a mobile API client that reads an environment-specific backend base URL, attaches `Authorization: Bearer <Firebase ID token>`, handles 401 refresh, and mirrors backend response unwrapping.

**P0 - Complete shared auth and role onboarding contract:**
- Issue: Role creation, onboarding completion, and fallback behavior are split across frontend state, Firebase tokens, backend DB role updates, and local-only fallbacks.
- Files: `components/auth/AuthForm.tsx`, `components/landing/AuthModal.tsx`, `app/onboarding/page.tsx`, `components/onboarding/PatientOnboarding.tsx`, `components/onboarding/DoctorOnboarding.tsx`, `components/onboarding/ReceptionistOnboarding.tsx`, `backend/src/middlewares/firebaseAuth.middleware.ts`, `backend/src/modules/auth/auth.controller.ts`
- Impact: Mobile parity can create accounts that appear authenticated but have missing DB profiles, stale role claims, or local onboarding state not persisted to PostgreSQL.
- Fix approach: Make backend `/api/v1/auth/sync-profile` the single source of truth for role, profile creation, clinic linkage, and onboarding completion. Mobile and web should both block completion when required backend writes fail.

## Missing Mobile App Functionality

**Mobile source tree:**
- Issue: `pulsecalapp/` is empty.
- Files: `pulsecalapp/`
- Impact: No navigation, screens, auth, API client, payments, push notifications, or role-specific workflows exist for mobile.
- Fix approach: Add the mobile app structure before feature parity work: `pulsecalapp/package.json`, app entry, navigation, environment config, Firebase Auth setup, API client, role guards, and shared type definitions.

**Patient pages required for parity:**
- Issue: Patient web flows cover dashboards, doctor discovery, booking, appointment details, cancellation/rescheduling, queue, records, prescriptions, insurance, payments, maps, notifications, chat, profile, and security, but mobile equivalents are absent.
- Files: `app/(dashboard)/dashboard/page.tsx`, `components/pages/dashboard/PatientDashboardPage.tsx`, `app/(dashboard)/appointments/create/page.tsx`, `components/appointments/PatientBookFlow.tsx`, `app/(dashboard)/doctors/[id]/book/page.tsx`, `app/(dashboard)/appointments/[id]/page.tsx`, `app/(dashboard)/appointments/[id]/cancel/page.tsx`, `app/(dashboard)/appointments/[id]/reschedule/page.tsx`, `app/(dashboard)/queue/status/page.tsx`, `app/(dashboard)/health/medical-records/page.tsx`, `app/(dashboard)/health/prescriptions/page.tsx`, `app/(dashboard)/services/insurance/page.tsx`, `app/(dashboard)/services/payments/page.tsx`, `app/(dashboard)/services/maps/page.tsx`, `app/(dashboard)/notifications/page.tsx`, `app/chat/rooms/page.tsx`, `app/(dashboard)/profile/page.tsx`, `app/(dashboard)/profile/security/page.tsx`
- Impact: A patient cannot use the mobile app for the core PulseCal journey.
- Fix approach: Implement patient tabs and flows first: auth/onboarding, dashboard, doctor search, booking/payment, appointments, records, prescriptions, payments, notifications, profile, and support chat.

**Doctor pages required for parity:**
- Issue: Doctor web flows cover onboarding, clinic setup, subscription payment, dashboard, appointment calendar/list/details, patient records, prescriptions, analytics, reports, schedule, staff, subscription, revenue/payments, chat, notifications, and profile.
- Files: `components/onboarding/DoctorOnboarding.tsx`, `components/pages/dashboard/DoctorDashboardPage.tsx`, `app/(dashboard)/appointments/calendar/page.tsx`, `app/(dashboard)/appointments/list/page.tsx`, `app/(dashboard)/patients/page.tsx`, `app/(dashboard)/health/medical-records/page.tsx`, `app/(dashboard)/health/prescriptions/page.tsx`, `app/(dashboard)/dashboard/analytics/page.tsx`, `app/(dashboard)/dashboard/reports/page.tsx`, `app/(dashboard)/dashboard/schedule/page.tsx`, `app/(dashboard)/dashboard/staff/page.tsx`, `app/(dashboard)/subscription/page.tsx`, `app/(dashboard)/services/payments/page.tsx`
- Impact: A doctor cannot onboard, operate clinic schedules, manage patients, accept payments/subscriptions, or review analytics from mobile.
- Fix approach: Implement doctor onboarding with payment verification, then dashboard, schedule, appointments, patient directory, records/prescriptions, staff, payments, and subscription management.

**Receptionist pages required for parity:**
- Issue: Receptionist web flows cover onboarding/linking to clinic, dashboard stats, queue, clinic doctors, appointment create/update/check-in/cancel/reschedule, patients, notifications, and profile.
- Files: `components/onboarding/ReceptionistOnboarding.tsx`, `components/pages/dashboard/ReceptionistDashboardPage.tsx`, `app/(dashboard)/appointments/create/page.tsx`, `app/(dashboard)/patients/page.tsx`, `app/(dashboard)/queue/status/page.tsx`, `backend/src/modules/receptionists/receptionists.routes.ts`
- Impact: Receptionists cannot run front desk workflows from mobile.
- Fix approach: Implement receptionist login only through admin/doctor-created accounts, clinic linking, dashboard, queue/check-in, appointment management, patient registration, and payments status views.

**Admin pages required for parity:**
- Issue: Admin web flows cover a separate admin login and dashboard for clinics, users, reports, analytics, and doctor payouts; mobile has no admin implementation.
- Files: `app/admin/login/page.tsx`, `app/admin/layout.tsx`, `app/admin/dashboard/page.tsx`, `app/admin/clinics/page.tsx`, `app/admin/users/page.tsx`, `app/admin/reports/page.tsx`, `app/admin/analytics/page.tsx`, `app/admin/doctors/payouts/page.tsx`, `backend/src/modules/admin/admin.routes.ts`
- Impact: If admin parity is required on mobile, there is no role-specific entry point or protected navigation.
- Fix approach: Decide whether admin is mobile-supported. If yes, build a separate admin stack with stricter MFA/session policy and no patient/doctor tab leakage.

## Broken API Routes and Config

**Direct backend URL is hardcoded in website proxy fallback:**
- Issue: Next API proxy falls back to a raw AWS IP over HTTP.
- Files: `app/api/v1/[...path]/route.ts`, `app/api/proxy/[...path]/route.ts`, `PulseCal_Postman_Collection.json`
- Impact: Mobile requires HTTPS for production auth/payment flows. A hardcoded HTTP IP also makes environment switching brittle and may fail app store/network security policies.
- Fix approach: Require `BACKEND_URL` per environment and use HTTPS domain names. Mobile should not depend on the Next.js proxy.

**Two proxy implementations disagree on backend path handling:**
- Issue: `app/api/v1/[...path]/route.ts` appends `/api/v1`, while `app/api/proxy/[...path]/route.ts` forwards raw paths without adding `/api/v1`.
- Files: `app/api/v1/[...path]/route.ts`, `app/api/proxy/[...path]/route.ts`
- Impact: Any mobile or shared code copied from the website may target the wrong route prefix.
- Fix approach: Deprecate `app/api/proxy/[...path]/route.ts` or align it with `app/api/v1/[...path]/route.ts`; publish one canonical backend URL scheme.

**Admin login unwraps API response incorrectly:**
- Issue: `apiService.post()` unwraps backend `{ success, data }`, but admin login reads `response.data`.
- Files: `app/admin/login/page.tsx`, `services/api.ts`
- Impact: Admin login can fail or treat the profile as undefined even after successful Firebase auth, blocking admin parity and shared login logic.
- Fix approach: Use the unwrapped profile directly in `app/admin/login/page.tsx` and add an admin login test before copying the flow to mobile.

**Patient onboarding sends wrong emergency contact shape:**
- Issue: Patient onboarding posts `{ name, phone, relation }`, but the backend requires `{ firstName, lastName, relationship, phone }`.
- Files: `components/onboarding/PatientOnboarding.tsx`, `backend/src/modules/emergencyContacts/emergencyContacts.controller.ts`
- Impact: Emergency contact creation fails during onboarding, then the UI still proceeds with local completion.
- Fix approach: Align the request body and treat emergency contact save failures as visible backend failures, not silent warnings.

**Insurance route mismatch blocks web and mobile parity:**
- Issue: The insurance UI posts to `/patients/insurance`, while backend routes expose `/api/v1/insurance`.
- Files: `components/insurance/AddInsuranceDialog.tsx`, `backend/src/modules/insurance/insurance.routes.ts`, `backend/src/routes.ts`
- Impact: Insurance create/update cannot work through the current canonical backend route unless another proxy/legacy route exists outside `backend/src/routes.ts`.
- Fix approach: Change clients to `/insurance` or add a documented backend alias with tests.

**Mobile cannot reuse browser-only features as-is:**
- Issue: Website flows depend on browser APIs including `window`, `localStorage`, `sessionStorage`, `navigator.geolocation`, popup Google sign-in, and `window.Razorpay`.
- Files: `lib/firebase.ts`, `lib/firebaseAuth.ts`, `components/onboarding/DoctorOnboarding.tsx`, `components/onboarding/PatientOnboarding.tsx`, `services/api.ts`
- Impact: Direct code reuse in React Native will fail without platform adapters.
- Fix approach: Create mobile adapters for auth persistence, Google sign-in, geolocation permissions, secure token storage, file upload, and Razorpay checkout.

## Role Login and Signup Gaps

**Receptionist signup creates Firebase user before rejecting in one path:**
- Issue: `AuthForm` calls Firebase signup before checking and rejecting `RECEPTIONIST`.
- Files: `components/auth/AuthForm.tsx`
- Impact: A blocked receptionist signup can leave a Firebase user without a valid PulseCal role/profile.
- Fix approach: Reject restricted roles before creating the Firebase account.

**Receptionist signup is allowed in another path:**
- Issue: `AuthModal` accepts `role?: "doctor" | "patient" | "receptionist"` and syncs the selected role without the restriction present in `AuthForm`.
- Files: `components/landing/AuthModal.tsx`, `components/auth/AuthForm.tsx`
- Impact: Website and mobile can diverge on whether receptionists self-register or must be invited/created by staff.
- Fix approach: Centralize role signup policy in backend and expose only allowed roles to all clients.

**Admin signup has no normal client flow:**
- Issue: Admin role exists in the DB and routes, but creation is script/admin-route oriented rather than a first-class authenticated signup path.
- Files: `backend/prisma/schema.prisma`, `backend/src/scripts/createAndPromoteAdmin.ts`, `backend/src/modules/users/users.routes.ts`, `app/admin/login/page.tsx`
- Impact: Mobile admin parity cannot depend on self-signup. Admin users must be provisioned through backend tooling or staff management.
- Fix approach: Document admin provisioning and implement mobile admin login only after the backend admin identity path is verified.

**Firebase role claims can drift from DB role:**
- Issue: Direct user signup/sync changes DB role, but custom claims are set only in selected backend flows.
- Files: `backend/src/middlewares/firebaseAuth.middleware.ts`, `backend/src/modules/users/users.service.ts`, `backend/src/modules/payment-gateway/payment-gateway.controller.ts`, `components/auth/GoogleSignInButton.tsx`
- Impact: Mobile may read token claims that disagree with backend DB role, especially around doctor onboarding and role fallbacks.
- Fix approach: After every backend-approved role change, update Firebase custom claims and force token refresh on clients.

**Onboarding fallback marks users complete locally after backend failures:**
- Issue: Patient, doctor, receptionist, and generic onboarding flows dispatch `onboardingCompleted: true` locally after API timeouts/errors.
- Files: `app/onboarding/page.tsx`, `components/onboarding/PatientOnboarding.tsx`, `components/onboarding/DoctorOnboarding.tsx`, `components/onboarding/ReceptionistOnboarding.tsx`
- Impact: Mobile can show dashboards for users whose DB profile, clinic, emergency contacts, doctor profile, or receptionist clinic link were not saved.
- Fix approach: Make mobile onboarding transaction-like: required backend writes must succeed before local role navigation unlocks the dashboard.

## Payment Gateway Risks

**Payment route surface is fragmented:**
- Issue: Backend exposes `/payments/create-subscription`, `/payments/verify-subscription`, `/payments/subscription/create`, `/payments/subscription/verify`, `/payments/create-order`, `/payments/verify`, `/payments/appointment/create-order`, `/payments/appointment/verify`, and `/payment-gateway/create-order`/`verify`.
- Files: `backend/src/modules/payments/payments.routes.ts`, `backend/src/modules/payment-gateway/payment-gateway.routes.ts`, `components/onboarding/DoctorOnboarding.tsx`, `app/(dashboard)/appointments/[id]/page.tsx`
- Impact: Mobile can easily integrate the wrong checkout path or miss side effects such as clinic creation, subscription activation, or appointment confirmation.
- Fix approach: Publish one payment matrix for mobile: doctor subscription checkout, patient appointment checkout, payment history, refunds/status, and webhooks. Deprecate legacy routes after migration.

**Patient appointment payment trusts client-provided amount:**
- Issue: Patient-facing payment order creation accepts `amount` from the client.
- Files: `backend/src/modules/payments/payments.controller.ts`, `app/(dashboard)/appointments/[id]/page.tsx`, `backend/prisma/schema.prisma`
- Impact: A mobile client could submit an amount that does not match the doctor's consultation fee unless the backend recomputes and validates it.
- Fix approach: Compute appointment/payment amount server-side from `DoctorProfile.consultationFee` or an immutable pending appointment quote.

**Razorpay secret defaults can mask misconfiguration:**
- Issue: Payment code falls back to placeholder or test secrets when env vars are missing.
- Files: `backend/src/config/env.ts`, `backend/src/modules/payments/payments.controller.ts`, `backend/src/modules/payment-gateway/payment-gateway.controller.ts`
- Impact: Payment failures may appear only at runtime, and test credentials can accidentally leak into non-production flows.
- Fix approach: Make Razorpay key ID, key secret, and webhook secret required in production startup validation.

**Razorpay Web Checkout is browser-specific:**
- Issue: Web doctor onboarding opens `window.Razorpay`.
- Files: `components/onboarding/DoctorOnboarding.tsx`
- Impact: React Native cannot use this code path directly.
- Fix approach: Use Razorpay React Native SDK or a controlled hosted checkout webview with native return handling and backend verification.

**Webhook and client verification both update state:**
- Issue: Backend has a webhook route and multiple client verify routes that can create/update payments, subscriptions, appointments, clinics, and doctor profiles.
- Files: `backend/src/modules/payments/payments.routes.ts`, `backend/src/modules/payments/payments.controller.ts`, `backend/src/modules/payment-gateway/payment-gateway.controller.ts`
- Impact: Duplicate payment records or conflicting state can occur without idempotency around Razorpay order/payment IDs.
- Fix approach: Add idempotency checks on `razorpayOrderId`, `razorpayPaymentId`, and appointment IDs before mobile launch.

## Sync and Data Consistency Risks

**Offline patients do not have Firebase accounts:**
- Issue: Receptionist patient registration creates DB users with synthetic local email and no `firebaseUid`.
- Files: `backend/src/modules/receptionists/receptionists.service.ts`, `backend/prisma/schema.prisma`
- Impact: Offline patients cannot log in to mobile with the same account unless a claim/activation flow links a Firebase identity to the existing DB user.
- Fix approach: Add patient account claiming by phone/email with OTP/admin approval and merge/link the new Firebase UID to the offline DB record.

**Clinic linking has no real verification enforcement:**
- Issue: Receptionist onboarding collects a verification code, but backend ignores it.
- Files: `components/onboarding/ReceptionistOnboarding.tsx`, `backend/src/modules/receptionists/receptionists.service.ts`
- Impact: Any authenticated receptionist can link to any active clinic by ID if they can discover it.
- Fix approach: Add invitation codes, staff invites, or owner approval before exposing receptionist mobile onboarding.

**Queue mixes real and virtual entries:**
- Issue: Queue service combines real queue rows with scheduled appointments as virtual queue entries.
- Files: `backend/src/modules/receptionists/receptionists.service.ts`, `app/(dashboard)/queue/status/page.tsx`, `components/pages/dashboard/ReceptionistDashboardPage.tsx`
- Impact: Mobile must distinguish queue rows from virtual appointment rows before calling queue mutation routes, otherwise it may update an appointment ID as a queue ID.
- Fix approach: Add explicit response types and allowed actions for real queue entries vs scheduled appointment entries.

**Profile fields are accepted without strict validation:**
- Issue: User profile update validation is removed and arbitrary request fields are passed into service logic.
- Files: `backend/src/modules/users/users.controller.ts`, `backend/src/modules/users/users.service.ts`
- Impact: Mobile clients can send unsupported fields that are ignored, fail Prisma writes, or create inconsistent expectations across platforms.
- Fix approach: Restore role-aware schemas for user profile, patient profile, doctor profile, and receptionist profile updates.

**Medical/insurance/payment sensitive fields rely on local encryption helpers:**
- Issue: The schema stores encrypted PHI/payment fields, but mobile upload/download flows and key rotation behavior are not specified.
- Files: `backend/prisma/schema.prisma`, `backend/src/utils/encrypt.ts`, `backend/src/modules/medicalRecords/medicalRecords.service.ts`, `backend/src/modules/insurance/insurance.service.ts`, `backend/src/modules/payments/payments.service.ts`
- Impact: Mobile can create records without consistent encryption/attachment behavior unless all PHI writes go through backend services.
- Fix approach: Keep encryption server-side only, define mobile file upload APIs, and verify all PHI-bearing endpoints use the same service layer.

## Security Considerations

**Secrets and public keys need clearer boundaries:**
- Risk: Firebase web config is hardcoded client-side, backend service-account JSON is expected via env, and `.env.local` exists in the repo working tree.
- Files: `lib/firebase.ts`, `backend/src/config/firebase.ts`, `backend/src/config/env.ts`, `.env.local`
- Current mitigation: Backend reads secrets from environment and `.env.local` contents were not inspected.
- Recommendations: Move Firebase public config into environment variables, never commit local env files, and document mobile `google-services`/Firebase config handling separately from backend service-account credentials.

**Request logging may capture sensitive request bodies elsewhere:**
- Risk: App-level request logging logs method/path/headers safely, but profile controller logs full request bodies and payment errors may include gateway details.
- Files: `backend/src/app.ts`, `backend/src/modules/users/users.controller.ts`, `backend/src/modules/payments/payments.controller.ts`, `backend/src/modules/payment-gateway/payment-gateway.controller.ts`
- Current mitigation: Authorization header is logged only as present/missing in app middleware.
- Recommendations: Redact profile, payout, UPI, bank account, PHI, and payment fields before logging.

**Payout details are stored and displayed as plain text:**
- Risk: Doctor bank account details and UPI IDs are saved on doctor profiles and shown in admin payout UI.
- Files: `backend/prisma/schema.prisma`, `backend/src/modules/users/users.service.ts`, `backend/src/modules/doctor-profiles/doctor-profiles.controller.ts`, `app/admin/doctors/payouts/page.tsx`, `app/(dashboard)/profile/page.tsx`
- Current mitigation: None detected for payout fields.
- Recommendations: Encrypt payout fields server-side, redact in list views, and restrict mobile/admin access by role and audit logging.

**MFA is modeled but not implemented in visible auth flows:**
- Risk: `mfaEnabled` and `mfaSecret` exist in the DB model, while login flows use Firebase email/password or Google without app-level MFA enforcement.
- Files: `backend/prisma/schema.prisma`, `components/dashboard/settings/SecuritySettings.tsx`, `app/admin/login/page.tsx`, `components/auth/AuthForm.tsx`
- Current mitigation: Firebase handles base authentication.
- Recommendations: Require MFA for admin and optionally doctor/receptionist accounts before implementing mobile admin or payout access.

**Rate limiting appears disabled or handled by deployment scripts:**
- Risk: Scripts reference disabled API rate limiter fixes and verification.
- Files: `backend/COMPLETE_FIX_RATE_LIMITER.sh`, `backend/VERIFY_RATE_LIMITER_DISABLED.sh`, `backend/src/app.ts`
- Current mitigation: Helmet, HPP, CORS, Firebase token verification.
- Recommendations: Reinstate production-safe rate limiting before mobile launch because native clients increase login, search, booking, and payment API traffic.

## Performance Bottlenecks

**Polling instead of push for receptionist dashboard:**
- Problem: Receptionist dashboard uses polling as a fallback.
- Files: `components/pages/dashboard/ReceptionistDashboardPage.tsx`, `backend/src/socket/queue.socket.ts`, `backend/src/socket/notification.socket.ts`
- Cause: Socket behavior is implemented on backend, but mobile integration is not defined.
- Improvement path: Add mobile socket client support for queue, notifications, chat, and appointment updates; use polling only as backup.

**Doctor discovery depends on web map and browser geolocation patterns:**
- Problem: Doctor search and maps use browser-oriented components.
- Files: `components/doctors/DoctorDiscoveryMap.tsx`, `app/(dashboard)/services/maps/page.tsx`, `components/onboarding/PatientOnboarding.tsx`
- Cause: React Leaflet/browser geolocation do not port directly to native.
- Improvement path: Implement native maps/geolocation and keep backend search parameters consistent with `backend/src/modules/doctors/doctors.routes.ts`.

## Fragile Areas

**Auth/profile/onboarding flow:**
- Files: `lib/firebaseAuth.ts`, `app/providers.tsx`, `components/auth/AuthForm.tsx`, `components/landing/AuthModal.tsx`, `app/onboarding/page.tsx`, `backend/src/middlewares/firebaseAuth.middleware.ts`, `backend/src/modules/auth/auth.controller.ts`
- Why fragile: Multiple fallbacks create partial users and allow frontend state to diverge from backend persisted state.
- Safe modification: Add end-to-end tests for signup/login/onboarding per role, then reuse the tested backend contract from mobile.
- Test coverage: No focused auth parity tests detected.

**Payments/subscriptions:**
- Files: `backend/src/modules/payments/payments.routes.ts`, `backend/src/modules/payments/payments.controller.ts`, `backend/src/modules/payment-gateway/payment-gateway.controller.ts`, `components/onboarding/DoctorOnboarding.tsx`, `app/(dashboard)/appointments/[id]/page.tsx`
- Why fragile: Multiple overlapping routes, client-provided amounts, browser-only checkout, webhook/client side effects, and placeholder env fallbacks.
- Safe modification: Choose canonical mobile payment flows and add idempotent backend payment tests before adding native checkout.
- Test coverage: No Razorpay integration or idempotency tests detected.

**Clinic/staff ownership:**
- Files: `backend/src/modules/users/users.routes.ts`, `backend/src/modules/users/users.service.ts`, `backend/src/modules/clinics/clinics.controller.ts`, `backend/src/modules/receptionists/receptionists.service.ts`, `components/dashboard/StaffManager.tsx`
- Why fragile: Clinic owner can be auto-assigned based on earliest doctor; receptionist links ignore verification code; staff creation mixes Firebase and DB writes.
- Safe modification: Define explicit clinic owner/invite rules and apply them consistently to mobile and web.
- Test coverage: No staff invitation or clinic ownership tests detected.

## Scaling Limits

**Mobile release blocked by no app implementation:**
- Current capacity: `pulsecalapp/` has zero tracked source files.
- Limit: No mobile workflow can be tested or released.
- Scaling path: Build app shell and P0 patient/doctor flows first, then expand receptionist/admin.

**AWS/backend endpoint stability:**
- Current capacity: Web proxy defaults to raw HTTP AWS IP.
- Limit: Native production apps need stable HTTPS domains and environment-specific configs.
- Scaling path: Configure production/staging backend domains, TLS, CORS, socket origins, and mobile env files.

## Dependencies at Risk

**Razorpay browser checkout:**
- Risk: `window.Razorpay` is web-only.
- Impact: Doctor subscription and patient payment flows do not port to native.
- Migration plan: Use Razorpay mobile SDK or hosted checkout webview with backend-only verification.

**Firebase browser auth:**
- Risk: Website auth relies on browser storage and popup sign-in.
- Impact: Mobile requires different Firebase persistence and Google Sign-In implementation.
- Migration plan: Use React Native Firebase or Firebase JS with native persistence and a platform-specific Google auth provider.

## Missing Critical Features

**Mobile secure storage and session persistence:**
- Problem: No mobile token storage or refresh strategy exists.
- Blocks: All authenticated API calls and role guards.

**Mobile push notifications:**
- Problem: Backend/web notifications exist, but mobile push registration and delivery are absent.
- Blocks: Appointment reminders, payment alerts, receptionist queue alerts, chat notifications.
- Files: `backend/src/modules/notifications/notifications.routes.ts`, `backend/src/socket/notification.socket.ts`, `app/(dashboard)/notifications/page.tsx`

**Mobile file upload/download:**
- Problem: Website uploads profile pictures and displays record files, but mobile upload adapters are absent.
- Blocks: Profile images, medical records, prescriptions, insurance documents.
- Files: `backend/src/middlewares/upload.middleware.ts`, `backend/src/modules/users/users.controller.ts`, `app/uploads/[...path]/route.ts`

**Account claiming for receptionist-created patients:**
- Problem: Offline patients have no Firebase identity.
- Blocks: Same database/account continuity when a walk-in patient later installs mobile.
- Files: `backend/src/modules/receptionists/receptionists.service.ts`, `backend/prisma/schema.prisma`

## Test Coverage Gaps

**Role signup/login/onboarding:**
- What's not tested: Patient, doctor, receptionist, and admin auth flows across Firebase, DB user creation, profile creation, role claims, and onboarding completion.
- Files: `components/auth/AuthForm.tsx`, `components/landing/AuthModal.tsx`, `backend/src/middlewares/firebaseAuth.middleware.ts`, `backend/src/modules/auth/auth.controller.ts`
- Risk: Mobile can ship with role drift or partial accounts.
- Priority: High

**Payment verification and idempotency:**
- What's not tested: Razorpay order creation, signature verification, webhook/client duplicate handling, subscription activation, appointment confirmation, and payment history visibility by role.
- Files: `backend/src/modules/payments/payments.controller.ts`, `backend/src/modules/payment-gateway/payment-gateway.controller.ts`, `backend/src/modules/payments/payments.service.ts`
- Risk: Payment records, clinic subscriptions, and appointment statuses can diverge.
- Priority: High

**Route parity contract:**
- What's not tested: Frontend/mobile request paths against backend route definitions.
- Files: `services/api.ts`, `backend/src/routes.ts`, `app/api/v1/[...path]/route.ts`, `backend/src/modules/*/*.routes.ts`
- Risk: Mobile implements stale or wrong endpoints.
- Priority: High

---

*Concerns audit: 2026-05-27*
