# Technology Stack

**Analysis Date:** 2026-05-27

## Languages

**Primary:**
- TypeScript 5.x - Next.js web frontend in `app/`, `components/`, `services/`, `lib/`, and backend source in `backend/src/`.
- JavaScript - Production backend entrypoint and legacy services in `backend/server.js`, `backend/services/googleCalendar.js`, `backend/services/calendly.js`, and backend deployment scripts in `backend/*.sh`.

**Secondary:**
- Prisma schema DSL - Database schema in `backend/prisma/schema.prisma`.
- Shell - AWS/PM2 deployment and diagnostics in `backend/deploy-aws.sh`, `backend/FINAL_DEPLOY.sh`, `backend/DEPLOY_FIX.sh`, and related scripts.
- Dart/Flutter - Not detected. No `pulsecalapp/`, `pubspec.yaml`, `analysis_options.yaml`, `android/`, `ios/`, or Flutter `lib/` app tree is present under `/Users/harshdev/Documents/Projects/pulsecal.web` or `/Users/harshdev/Documents/Projects`.

## Runtime

**Environment:**
- Node.js 18+ - Required by `README.md` and used by the Next.js frontend and Express backend.
- Next.js server runtime - Used for the Vercel-hosted web app and API proxy routes in `app/api/v1/[...path]/route.ts`, `app/api/proxy/[...path]/route.ts`, and `app/uploads/[...path]/route.ts`.
- Node.js production backend - `backend/server.js` imports compiled files from `backend/dist/` after `npm run build`.
- PM2 cluster mode - Production backend process manager configured in `backend/ecosystem.config.js`.

**Package Manager:**
- pnpm - Root lockfile `pnpm-lock.yaml` is present.
- npm - Backend scripts in `backend/package.json` and deployment docs in `backend/DEPLOY_AWS.md` use `npm install`, `npm run build`, and `npm start`.
- Lockfile: `pnpm-lock.yaml` present at repo root; no backend-specific lockfile detected.

## Frameworks

**Core:**
- Next.js 16.0.10 - App Router web frontend in `app/`; configured by `next.config.mjs`.
- React 19.2.0 - Web UI runtime in `app/` and `components/`.
- Express 4.21.1 - Backend API server mounted through `backend/src/routes.ts` and served by `backend/server.js`.
- Prisma 5.16.0 - PostgreSQL ORM with schema in `backend/prisma/schema.prisma` and client usage through `backend/src/config/database.ts`.
- Firebase Web SDK 12.7.0 - Client auth and analytics in `lib/firebase.ts` and auth helpers in `lib/firebaseAuth.ts`.
- Firebase Admin SDK 12.0.0 - Backend token verification and custom claims in `backend/src/config/firebase.ts`, `backend/src/middlewares/firebaseAuth.middleware.ts`, and payment controllers.

**Testing:**
- Jest - Backend test command `npm test` in `backend/package.json`.
- No root test runner config detected for the Next.js web app.
- No Flutter test runner detected because no Flutter app files are present.

**Build/Dev:**
- TypeScript 5.x - Root TypeScript config in `tsconfig.json`; backend TypeScript config in `backend/tsconfig.json`.
- tsx 4.16.2 - Backend dev server and scripts in `backend/package.json`.
- Tailwind CSS 4.1.9 - Web styling dependencies in `package.json` with PostCSS config in `postcss.config.mjs`.
- ESLint - Root lint script `eslint .` in `package.json`; backend lint script `eslint src --ext .ts` in `backend/package.json`.
- PM2 - Backend deployment runtime configured in `backend/ecosystem.config.js`.

## Key Dependencies

**Critical:**
- `firebase` `^12.7.0` - Web login, signup, Google auth, ID token retrieval, password reset, and analytics in `lib/firebase.ts` and `lib/firebaseAuth.ts`.
- `firebase-admin` `^12.0.0` - Backend Firebase token verification and role custom claims in `backend/src/config/firebase.ts`, `backend/src/middlewares/firebaseAuth.middleware.ts`, `backend/src/modules/payments/payments.controller.ts`, and `backend/src/modules/payment-gateway/payment-gateway.controller.ts`.
- `@prisma/client` `5.16.0` and `prisma` `5.16.0` - Shared PostgreSQL data model and migrations in `backend/prisma/schema.prisma`.
- `razorpay` `^2.9.6` - Appointment payments, subscription orders, legacy subscriptions, and webhooks in `backend/src/modules/payments/payments.controller.ts` and `backend/src/modules/payment-gateway/payment-gateway.controller.ts`.
- `axios` `1.13.2` - Web API client in `services/api.ts` and legacy backend service calls in `backend/services/calendly.js`.
- `socket.io` `^4.8.1` and `socket.io-client` `4.8.1` - Backend realtime namespaces in `backend/server.js` and client notifications in `services/socket.ts`.

**Infrastructure:**
- `@socket.io/redis-adapter` `^8.3.0`, `ioredis` `^5.4.1`, and `bullmq` `^5.22.1` - Redis-related infrastructure dependencies in `backend/package.json`; Redis adapter wiring is commented out in `backend/src/config/socket.ts`.
- `googleapis` `^169.0.0` and `google-auth-library` `^10.5.0` - Google Calendar integration in `backend/services/googleCalendar.js`.
- `nodemailer` `^6.9.16` - SMTP email support configured through env vars in `backend/src/config/env.ts`.
- `multer` `^1.4.5-lts.1` - Backend file upload middleware in `backend/src/middlewares/upload.middleware.ts`.
- `helmet`, `hpp`, `express-rate-limit`, `cookie-parser`, `cors` - Backend HTTP security and request handling dependencies in `backend/package.json`.

## Mobile Stack Status

**Flutter App:**
- Not detected. The requested `pulsecalapp` directory is absent from `/Users/harshdev/Documents/Projects/pulsecal.web`.
- No `pubspec.yaml` exists under `/Users/harshdev/Documents/Projects`, so Flutter SDK, Dart SDK constraints, package versions, state management, routing/navigation, Firebase mobile config, and payment SDK selection cannot be confirmed from this checkout.
- No `android/app/google-services.json`, `ios/Runner/GoogleService-Info.plist`, `lib/firebase_options.dart`, `android/`, or `ios/` files are present for mobile Firebase configuration.

**Expected Parity Contract for Mobile:**
- Use the same Firebase project as web: `pulsecal-72bb4`, configured in `lib/firebase.ts`.
- Use Firebase ID tokens as bearer tokens for backend calls, matching `services/api.ts` and `backend/src/middlewares/firebaseAuth.middleware.ts`.
- Use the AWS backend API under `/api/v1`, matching backend route mounting in `backend/src/routes.ts`.
- Use Razorpay payment flows that create and verify orders against backend endpoints in `backend/src/modules/payments/payments.routes.ts` and `backend/src/modules/payment-gateway/payment-gateway.routes.ts`.
- Do not create a separate auth system, database, payment backend, or Firebase project for mobile.

## Configuration

**Environment:**
- Web Firebase client config is hardcoded in `lib/firebase.ts` for project `pulsecal-72bb4`.
- Web API calls use a relative base URL `/api/v1` in `services/api.ts`; Next.js proxies these requests to `BACKEND_URL` in `app/api/v1/[...path]/route.ts`.
- Next.js proxy fallback backend is `http://13.205.127.21:3001` in `app/api/v1/[...path]/route.ts`, `app/api/proxy/[...path]/route.ts`, `app/api/test-backend/route.ts`, and `app/uploads/[...path]/route.ts`.
- Backend critical env vars are validated in `backend/src/config/env.ts`: `DATABASE_URL`, `ENCRYPTION_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `FIREBASE_PROJECT_ID`.
- Backend optional or integration env vars are configured in `backend/src/config/env.ts`: `DIRECT_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `SMTP_*`, `AWS_*`, `CORS_ORIGIN`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
- `.env.example` exists under `backend/.env.example`; contents were not read because environment files are treated as sensitive.
- `backend/ENV_TEMPLATE.txt` documents placeholder env var names for Firebase, Razorpay, Supabase/Postgres, SMTP, Redis, and AWS-style production setup.

**Build:**
- Root build: `next build` from `package.json`.
- Root dev: `next dev` from `package.json`.
- Root lint: `eslint .` from `package.json`.
- Backend build: `prisma generate && tsc` from `backend/package.json`.
- Backend dev: `fuser -k 3001/tcp || true && tsx watch src/server.ts` from `backend/package.json`.
- Backend production start: `node server.js` from `backend/package.json`.
- Backend production process: `backend/ecosystem.config.js` starts `./server.js` in PM2 cluster mode with `PORT=3001`.

## Platform Requirements

**Development:**
- Node.js 18+ and npm/yarn/pnpm for web and backend, as documented in `README.md`.
- PostgreSQL connection through `DATABASE_URL` and `DIRECT_URL` for Prisma in `backend/prisma/schema.prisma`.
- Firebase Authentication enabled for web login/signup and backend token verification.
- Razorpay keys for payment creation and verification.
- Flutter/Dart SDK requirements are not detectable without `pulsecalapp/pubspec.yaml`.

**Production:**
- Web frontend is designed for Vercel, with `vercel.json` configuring function duration for `app/api/**/*.ts`.
- Backend is designed for AWS EC2/PM2, documented in `backend/DEPLOY_AWS.md` and implemented by `backend/server.js` plus `backend/ecosystem.config.js`.
- Database is PostgreSQL via Supabase-style URLs, documented in `backend/DEPLOY_AWS.md` and modeled by `backend/prisma/schema.prisma`.
- Production backend listens on `0.0.0.0` by default in `backend/server.js`, expects SSL termination at a load balancer, and uses `CORS_ORIGIN`/`FRONTEND_URL` for frontend access.

## Critical Blockers for Mobile Parity

- `pulsecalapp/` is absent, so Flutter/Dart versions, packages, state management, routing, Firebase mobile config, and mobile payment SDK config are not verifiable in this repo.
- The web frontend calls the backend through Next.js relative proxy routes in `services/api.ts` and `app/api/v1/[...path]/route.ts`; a native mobile app cannot use this Vercel-relative proxy and needs a direct HTTPS API base URL for the AWS backend.
- The hardcoded backend fallback is plain HTTP `http://13.205.127.21:3001` in proxy routes; native mobile and production web sockets should use an HTTPS API domain to avoid transport, security, and app store policy issues.
- The web Razorpay checkout relies on the browser script `https://checkout.razorpay.com/v1/checkout.js` in `app/layout.tsx`; Flutter requires a native-compatible Razorpay package and callback mapping to the same backend verification endpoints.
- Firebase web config in `lib/firebase.ts` does not provide mobile platform config; Flutter needs platform-specific Firebase app registration and generated config artifacts for Android and iOS.

---

*Stack analysis: 2026-05-27*
