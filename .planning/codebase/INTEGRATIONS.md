# External Integrations

**Analysis Date:** 2026-05-27

## APIs & External Services

**Backend API:**
- AWS-hosted PulseCal Express API - Shared API surface for web and intended mobile parity.
  - SDK/Client: Web uses `axios` through `services/api.ts`; backend uses Express routers in `backend/src/routes.ts`.
  - Auth: Firebase ID token in `Authorization: Bearer <token>`, added by `services/api.ts` and verified by `backend/src/middlewares/firebaseAuth.middleware.ts`.
  - Base path: `/api/v1`, configured by `backend/src/routes.ts`.
  - Web proxy: `app/api/v1/[...path]/route.ts` forwards relative web requests to `BACKEND_URL`.
  - Fallback backend URL: `http://13.205.127.21:3001` in `app/api/v1/[...path]/route.ts`, `app/api/proxy/[...path]/route.ts`, `app/api/test-backend/route.ts`, and `app/uploads/[...path]/route.ts`.
  - Mobile requirement: native Flutter must call a direct HTTPS backend URL, not the web-relative `/api/v1` proxy.

**Authentication:**
- Firebase Authentication - Email/password, Google sign-in, password reset, current user, ID token retrieval.
  - SDK/Client: `firebase` web SDK in `lib/firebase.ts` and `lib/firebaseAuth.ts`.
  - Auth: Web client config in `lib/firebase.ts`; backend Admin SDK credentials through `FIREBASE_SERVICE_ACCOUNT_KEY` or `FIREBASE_PROJECT_ID` in `backend/src/config/firebase.ts`.
  - Project: `pulsecal-72bb4` in `lib/firebase.ts`.
  - Backend sync: `POST /api/v1/auth/sync-profile` in `backend/src/modules/auth/auth.routes.ts`.
  - Backend profile: `GET /api/v1/auth/profile` in `backend/src/modules/auth/auth.routes.ts`.

**Payments:**
- Razorpay - Appointment payments, one-time subscription orders, legacy auto-debit subscription support, and payment webhooks.
  - SDK/Client: Browser checkout script loaded in `app/layout.tsx`; backend SDK `razorpay` in `backend/src/modules/payments/payments.controller.ts` and `backend/src/modules/payment-gateway/payment-gateway.controller.ts`.
  - Auth: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, plus optional `RAZORPAY_PLAN_BASIC`, `RAZORPAY_PLAN_PROFESSIONAL`, and `RAZORPAY_PLAN_ENTERPRISE`.
  - Web subscription UI: `app/(dashboard)/subscription/page.tsx`.
  - Doctor onboarding payment UI: `components/onboarding/DoctorOnboarding.tsx`.
  - Appointment payment UI: `app/(dashboard)/appointments/[id]/page.tsx`.
  - Backend routes: `backend/src/modules/payments/payments.routes.ts` and `backend/src/modules/payment-gateway/payment-gateway.routes.ts`.
  - Mobile requirement: Flutter needs a native Razorpay integration that sends the same order and signature fields to backend verify endpoints.

**Realtime:**
- Socket.IO - Notifications, chat, queue, and payment/appointment updates.
  - SDK/Client: `socket.io-client` in `services/socket.ts`.
  - Auth: Firebase ID token in socket auth and authorization headers from `services/socket.ts`; verified in `backend/src/config/socket.ts`.
  - Namespaces: backend initializes chat, queue, and notification sockets in `backend/server.js`.
  - Mobile requirement: Flutter Socket.IO client must connect to HTTPS backend namespace URLs and provide the same Firebase bearer token.

**Maps and Location:**
- Google Maps - Doctor onboarding address/map embed.
  - SDK/Client: iframe URL using `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `components/onboarding/DoctorOnboarding.tsx`.
  - Auth: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

**Calendar and Scheduling:**
- Google Calendar - OAuth and calendar event management.
  - SDK/Client: `googleapis` backend service in `backend/services/googleCalendar.js`.
  - Auth: `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI`.
  - Stored tokens: `googleCalendarAccessToken`, `googleCalendarRefreshToken`, `googleCalendarTokenExpiry`, and `googleCalendarConnected` fields in `backend/prisma/schema.prisma`.
- Calendly - OAuth, event type retrieval, scheduled event retrieval, cancellation, and webhook signature verification.
  - SDK/Client: `axios` backend service in `backend/services/calendly.js`.
  - Auth: `CALENDLY_CLIENT_ID`, `CALENDLY_CLIENT_SECRET`, `CALENDLY_REDIRECT_URI`, `CALENDLY_WEBHOOK_SIGNING_KEY`.

**Analytics:**
- Vercel Analytics - Web analytics provider mounted in `app/layout.tsx`.
  - SDK/Client: `@vercel/analytics` dependency in `package.json`.
  - Auth: Vercel project configuration.
- Firebase Analytics - Production browser analytics initialized in `lib/firebase.ts`.
  - SDK/Client: Firebase Web Analytics through `getAnalytics`.
  - Auth: Firebase web config in `lib/firebase.ts`.

## Data Storage

**Databases:**
- PostgreSQL, documented as Supabase-style production database.
  - Connection: `DATABASE_URL` and `DIRECT_URL`.
  - Client: Prisma Client from `@prisma/client`, configured in `backend/src/config/database.ts`.
  - Schema: `backend/prisma/schema.prisma`.
  - Production guidance: `backend/DEPLOY_AWS.md` specifies `DATABASE_URL` as Supabase pooler URI and `DIRECT_URL` as direct Supabase URI.
  - Shared account identity: `User.firebaseUid` in `backend/prisma/schema.prisma` links Firebase accounts to database users.

**File Storage:**
- Local backend uploads proxied through web.
  - Upload middleware: `backend/src/middlewares/upload.middleware.ts`.
  - Web upload proxy: `app/uploads/[...path]/route.ts` forwards files to `${BACKEND_URL}/uploads/...`.
  - AWS S3 env placeholders exist in `backend/src/config/env.ts` as `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and `AWS_S3_BUCKET`, but no S3 client integration was detected in the read files.

**Caching:**
- Redis optional.
  - Connection env: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` in `backend/src/config/env.ts`.
  - Runtime connection: `connectRedis()` imported by `backend/server.js`.
  - Socket.IO Redis adapter dependency exists in `backend/package.json`, but adapter wiring is commented out in `backend/src/config/socket.ts`.

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication.
  - Implementation: Web signs users in through Firebase in `lib/firebaseAuth.ts`, obtains an ID token, sends it to backend, and backend verifies it with Firebase Admin in `backend/src/middlewares/firebaseAuth.middleware.ts`.
  - Profile sync: `syncUserProfile()` in `lib/firebaseAuth.ts` calls `POST /auth/sync-profile`, routed by `backend/src/modules/auth/auth.routes.ts`.
  - User lookup: backend middleware uses `firebaseUid` first, then email fallback in `backend/src/middlewares/firebaseAuth.middleware.ts`.
  - Role model: database roles use `UserRole` enum in `backend/prisma/schema.prisma`; Firebase custom claims are updated in `backend/src/modules/users/users.service.ts`, `backend/src/modules/payments/payments.controller.ts`, and `backend/src/modules/payment-gateway/payment-gateway.controller.ts`.
  - Mobile config status: No `pulsecalapp/`, `firebase_options.dart`, `google-services.json`, or `GoogleService-Info.plist` detected, so mobile is not currently wired to the same Firebase project from this checkout.

## API Routing and Backend Integration Points

**Web API Client:**
- `services/api.ts` uses `API_BASE_URL = "/api/v1"` and attaches Firebase bearer tokens to every request.
- `app/api/v1/[...path]/route.ts` is the main Vercel proxy to AWS backend. It preserves headers, supports binary/multipart bodies, avoids double `/api/v1`, and returns backend responses with `X-Proxy-Target`.
- `app/api/proxy/[...path]/route.ts` is a secondary JSON-only proxy path.
- `app/api/test-backend/route.ts` probes backend health and `/api/v1/doctors/search`.
- `app/uploads/[...path]/route.ts` proxies backend-uploaded files through the web app.

**Backend Route Prefixes:**
- `backend/src/routes.ts` mounts all API modules under `/api/v1`.
- Auth and profile: `/api/v1/auth` and `/api/v1/users`.
- Scheduling: `/api/v1/appointments`, `/api/v1/doctors`, `/api/v1/doctor-profiles`, `/api/v1/clinics`, `/api/v1/queue`.
- Health data: `/api/v1/medical-records`, `/api/v1/prescriptions`, `/api/v1/insurance`, `/api/v1/health-analytics`, `/api/v1/emergency-contacts`, `/api/v1/reminders`.
- Payments: `/api/v1/payments` and `/api/v1/payment-gateway`.
- Communications: `/api/v1/chat`, `/api/v1/telemedicine`, `/api/v1/notifications`, `/api/v1/reviews`.
- Admin and data: `/api/v1/admin`, `/api/v1/data`.

## Payment Behavior

**Razorpay Order Flow:**
- Appointment payments use `POST /api/v1/payments/appointment/create-order` and `POST /api/v1/payments/appointment/verify` in `backend/src/modules/payments/payments.routes.ts`.
- Existing appointment payments use `POST /api/v1/payments/create-order` and `POST /api/v1/payments/verify` in `backend/src/modules/payments/payments.routes.ts`.
- Subscription one-time upgrades use `GET /api/v1/payments/subscription/status`, `POST /api/v1/payments/subscription/create`, `POST /api/v1/payments/subscription/verify`, and `POST /api/v1/payments/subscription/cancel`.
- Legacy Razorpay subscriptions use `POST /api/v1/payments/create-subscription`, `POST /api/v1/payments/verify-subscription`, and `POST /api/v1/payments/cancel-subscription/:id`.
- Clean payment gateway routes use `POST /api/v1/payment-gateway/create-order` and `POST /api/v1/payment-gateway/verify`.

**Signature Verification:**
- Backend verifies Razorpay signatures with `RAZORPAY_KEY_SECRET` in `backend/src/modules/payments/payments.controller.ts` and `backend/src/modules/payment-gateway/payment-gateway.controller.ts`.
- Flutter must send `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to the same verification endpoints after native checkout completion.

**Client Mismatch:**
- Web relies on global `window.Razorpay` from `app/layout.tsx`.
- Flutter cannot reuse browser checkout code from `app/(dashboard)/subscription/page.tsx`, `components/onboarding/DoctorOnboarding.tsx`, or `app/(dashboard)/appointments/[id]/page.tsx`.

## Monitoring & Observability

**Error Tracking:**
- Dedicated external error tracking is not detected.
- Backend uses `pino`, `pino-http`, and `winston` dependencies in `backend/package.json`; production server imports logger from `backend/dist/utils/logger` in `backend/server.js`.

**Logs:**
- Backend logs server startup, CORS origins, socket connections, Redis failures, and fatal process errors in `backend/server.js` and `backend/src/config/socket.ts`.
- Deployment docs instruct PM2 log checks through `pm2 logs pulsecal` in `backend/DEPLOY_AWS.md`.
- Web logs Firebase initialization and API request/response errors in `lib/firebase.ts`, `lib/firebaseAuth.ts`, and `services/api.ts`.

## CI/CD & Deployment

**Hosting:**
- Web frontend: Vercel-style deployment with `vercel.json`, Next.js app in `app/`, and Vercel Analytics in `app/layout.tsx`.
- Backend: AWS EC2/PM2-style deployment documented in `backend/DEPLOY_AWS.md`, with production entrypoint `backend/server.js` and PM2 config `backend/ecosystem.config.js`.
- Database: Supabase-style PostgreSQL, documented in `backend/DEPLOY_AWS.md`.

**CI Pipeline:**
- Not detected. No GitHub Actions, CI config, or deployment workflow files were found in the explored integration files.

## Environment Configuration

**Required env vars:**
- Backend critical: `DATABASE_URL`, `ENCRYPTION_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FIREBASE_PROJECT_ID`.
- Backend database migration/direct connection: `DIRECT_URL`.
- Backend Firebase Admin: `FIREBASE_SERVICE_ACCOUNT_KEY` or `FIREBASE_PROJECT_ID`.
- Backend CORS/frontend: `CORS_ORIGIN`, `FRONTEND_URL`.
- Web proxy: `BACKEND_URL`; `NEXT_PUBLIC_BACKEND_URL` is used by socket-related code in `services/socket.ts` and backend test route fallback in `app/api/test-backend/route.ts`.
- Payments: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, optional `RAZORPAY_PLAN_BASIC`, `RAZORPAY_PLAN_PROFESSIONAL`, `RAZORPAY_PLAN_ENTERPRISE`.
- Redis: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.
- Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- Google Calendar: `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI`.
- Google Maps: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Calendly: `CALENDLY_CLIENT_ID`, `CALENDLY_CLIENT_SECRET`, `CALENDLY_REDIRECT_URI`, `CALENDLY_WEBHOOK_SIGNING_KEY`.
- Optional AWS storage placeholders: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`.

**Secrets location:**
- Backend secrets are expected in environment variables loaded by `dotenv` in `backend/src/config/env.ts` and `backend/server.js`.
- Vercel web/backend proxy secrets are expected in Vercel environment variables, especially `BACKEND_URL`, as documented in `backend/DEPLOY_AWS.md`.
- `.env.example` exists in `backend/.env.example`; contents were not read.
- `backend/ENV_TEMPLATE.txt` contains placeholder examples and environment variable names, not production secret values.

## Webhooks & Callbacks

**Incoming:**
- Razorpay webhook: `POST /api/v1/payments/razorpay/webhook`, routed in `backend/src/modules/payments/payments.routes.ts` and implemented in `backend/src/modules/payments/payments.controller.ts`.
- Calendly webhook support exists at service level through signature verification and webhook creation in `backend/services/calendly.js`; no mounted Calendly webhook route was confirmed in the explored router files.

**Outgoing:**
- Google Calendar event operations from `backend/services/googleCalendar.js`.
- Calendly API calls from `backend/services/calendly.js`.
- SMTP email via env-configured email settings in `backend/src/config/env.ts`.
- Socket.IO notifications emitted through backend socket modules initialized in `backend/server.js`.

## Production AWS/Vercel Mismatches

- Web HTTP API calls are shielded from mixed content by the Vercel proxy in `services/api.ts` and `app/api/v1/[...path]/route.ts`; Flutter does not get this proxy and needs an HTTPS AWS API domain.
- The hardcoded fallback backend URL is `http://13.205.127.21:3001`, which conflicts with production HTTPS expectations for mobile apps and WebSocket connections.
- `services/socket.ts` intentionally refuses socket connections when the frontend is HTTPS and `NEXT_PUBLIC_BACKEND_URL`/`BACKEND_URL` starts with `http://`; this indicates realtime parity depends on an HTTPS backend URL.
- `backend/server.js` expects SSL termination at a load balancer; if the backend is exposed directly over HTTP on EC2, web sockets and native app calls are fragile.
- `backend/DEPLOY_AWS.md` references PM2 process name `pulsecal`, while `backend/ecosystem.config.js` names the app `pulsecal-backend`; deployment scripts and operations should use one consistent PM2 process name.
- Web uses hardcoded Firebase web project config in `lib/firebase.ts`; mobile Firebase config files are absent, so mobile cannot yet prove it uses the same Firebase project and accounts.

## Critical Blockers for Mobile Integration

- No Flutter mobile app files are present: no `pulsecalapp/`, `pubspec.yaml`, mobile Firebase config files, or Dart source tree.
- Mobile API base URL is not defined in this checkout; parity requires direct HTTPS access to the same AWS backend mounted at `/api/v1`.
- Mobile auth config is not defined; parity requires the same Firebase project `pulsecal-72bb4` and the same ID token bearer behavior used by `services/api.ts`.
- Mobile payments are not configured; parity requires a Flutter-compatible Razorpay SDK and backend verification against the existing routes in `backend/src/modules/payments/payments.routes.ts` or `backend/src/modules/payment-gateway/payment-gateway.routes.ts`.
- Production realtime parity is blocked until the backend has an HTTPS Socket.IO endpoint accepted by `services/socket.ts`-equivalent mobile behavior.

---

*Integration audit: 2026-05-27*
