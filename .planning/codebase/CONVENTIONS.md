# Coding Conventions

**Analysis Date:** 2026-05-27

## Scope

**Mobile app focus:**
- Flutter app root: `pulsecalapp`
- Primary source: `pulsecalapp/lib`
- Tests: `pulsecalapp/test`
- Android config: `pulsecalapp/android`
- iOS config: `pulsecalapp/ios`

**Parity goal context:**
- Use the website/backend account model through Firebase ID tokens and the Express API.
- Treat the backend response envelope as `{ success, message, data, pagination? }`, matching `backend/src/utils/apiResponse.ts` and the web client unwrapping in `services/api.ts`.
- Avoid adding direct database writes from Flutter screens. Mobile app data access should go through `pulsecalapp/lib/data/datasources/remote/api_service.dart` and the existing backend API.

## Naming Patterns

**Files:**
- Use lower snake_case for Dart files: `pulsecalapp/lib/data/datasources/remote/api_service.dart`, `pulsecalapp/lib/presentation/screens/auth/auth_wrapper.dart`, `pulsecalapp/lib/presentation/screens/patient/appointments/appointments_screen.dart`.
- Place feature screens under role-specific folders: `pulsecalapp/lib/presentation/screens/patient`, `pulsecalapp/lib/presentation/screens/doctor`, `pulsecalapp/lib/presentation/screens/receptionist`.
- Place shared UI widgets under `pulsecalapp/lib/presentation/widgets`, for example `pulsecalapp/lib/presentation/widgets/custom_button.dart`.
- Place shared infrastructure under `pulsecalapp/lib/core`, for example `pulsecalapp/lib/core/network/dio_client.dart` and `pulsecalapp/lib/core/errors/exceptions.dart`.

**Functions:**
- Use lowerCamelCase for functions and methods: `firebaseLogin`, `getProfile`, `syncProfile`, `getAppointments`, `signInWithEmailPassword`.
- Prefer verb-first async methods for API operations: `createAppointment`, `updateInsurance`, `markAllNotificationsAsRead`.
- Keep endpoint methods centralized in `pulsecalapp/lib/data/datasources/remote/api_service.dart` instead of calling `DioClient` directly from screens.

**Variables:**
- Use lowerCamelCase for local variables and fields: `_client`, `_storage`, `queryParams`, `userCredential`, `authState`.
- Prefix private state and helpers with `_`: `_checkAuthStatus`, `_setupInterceptors`, `_handleResponseError`, `_isLoading`.
- Use explicit role strings consistently as lowercase in UI state (`patient`, `doctor`, `receptionist`) and uppercase only when the backend contract requires it.

**Types:**
- Use PascalCase for classes, models, entities, providers, and widgets: `ApiService`, `DioClient`, `AuthNotifier`, `AuthState`, `UserModel`, `AppointmentModel`.
- Model classes use a `Model` suffix in `pulsecalapp/lib/data/models`, while domain classes avoid the suffix in `pulsecalapp/lib/domain/entities`.
- Provider names use lowerCamelCase with a `Provider` suffix: `storageProvider`, `apiServiceProvider`, `authProvider`.

## Code Style

**Formatting:**
- Use Dart formatter defaults: `dart format .` from `pulsecalapp`.
- `analysis_options.yaml` includes `package:flutter_lints/flutter.yaml` in `pulsecalapp/analysis_options.yaml`.
- No custom formatter settings were detected. Keep standard two-space Flutter indentation and trailing commas for multi-line widget constructors.

**Linting:**
- Use `flutter analyze` from `pulsecalapp`.
- Current lint profile is the default `flutter_lints` ruleset in `pulsecalapp/analysis_options.yaml`.
- No custom analyzer severity overrides are configured.
- The analyzer output currently reports numerous info/warning findings in `pulsecalapp/flutter_analyze_output_recent.txt`, including deprecated Flutter API usage, unused imports, `avoid_print`, and naming issues.

**Generated/codegen:**
- Code generation dependencies exist in `pulsecalapp/pubspec.yaml`: `build_runner`, `freezed`, `json_serializable`, `riverpod_generator`, and `hive_generator`.
- No generated `*.g.dart` or `*.freezed.dart` files were detected in the explored source listing. Do not introduce generated annotations without adding the generated outputs or a clear generation workflow.

## Import Organization

**Order:**
1. Dart/Flutter packages: `package:flutter/material.dart`, `package:flutter_riverpod/flutter_riverpod.dart`.
2. Third-party packages: `package:dio/dio.dart`, `package:hive_flutter/hive_flutter.dart`, `package:firebase_auth/firebase_auth.dart`.
3. Relative project imports grouped by layer: core, data, domain, presentation.

**Path Aliases:**
- No Dart import aliases or package-level internal aliases are configured.
- Existing imports are package imports for external libraries and relative imports for local code, for example `../../../core/network/dio_client.dart` in `pulsecalapp/lib/data/datasources/remote/api_service.dart`.
- Prefer local relative imports within the Flutter app unless the project adds a consistent `package:pulsecal_mobile/...` convention.

## Error Handling

**Patterns:**
- Network transport errors are converted to custom exceptions in `pulsecalapp/lib/core/network/interceptors.dart`.
- Domain/repository operations convert exceptions into `Either<Failure, T>` in `pulsecalapp/lib/data/repositories/auth_repository_impl.dart`.
- UI auth state stores recoverable failures as strings in `AuthState.error` via `pulsecalapp/lib/presentation/providers/auth_provider.dart`.
- Local storage failures use `CacheException` in `pulsecalapp/lib/data/datasources/local/auth_local_datasource.dart`.

**Use this pattern for new work:**
- Throw `AppException` subclasses from data sources and interceptors in `pulsecalapp/lib/core/errors/exceptions.dart`.
- Convert exceptions to `Failure` subclasses at repository boundaries using `pulsecalapp/lib/core/errors/failures.dart`.
- Expose loading/error/data state through Riverpod providers in `pulsecalapp/lib/presentation/providers`.
- Keep UI screens responsible for rendering errors, not for parsing Dio exceptions.

**Build quality concern:**
- `ErrorInterceptor.onError` in `pulsecalapp/lib/core/network/interceptors.dart` throws exceptions before `handler.next(err)`. This can bypass Dio's normal error propagation and interact poorly with later interceptors.
- `TokenRefreshInterceptor` expects `/auth/refresh` with refresh tokens, but the current web/backend path relies on Firebase ID token refresh through Firebase Auth. Align this before relying on automatic mobile token refresh.
- Several auth flows in `pulsecalapp/lib/data/datasources/remote/firebase_auth_remote_datasource.dart` bypass backend failures with local fallback user maps. This weakens account/database parity because the app can mark a user authenticated without a backend profile.

## API Response Handling

**Patterns:**
- Backend success responses are wrapped by `backend/src/utils/apiResponse.ts` as `{ success, message, data }`.
- Web code unwraps this envelope centrally in `services/api.ts`.
- Flutter currently unwraps ad hoc in `pulsecalapp/lib/data/datasources/remote/api_service.dart`; some methods read `response.data['data']`, while `firebaseLogin`, `getProfile`, and `syncProfile` handle both wrapped and direct maps.

**Use this pattern for new work:**
- Add one typed unwrap helper in `pulsecalapp/lib/data/datasources/remote/api_service.dart` and use it consistently.
- Parse list endpoints from the backend envelope's `data` field, and preserve pagination where the backend includes it.
- Do not add screen-level fallbacks such as `response.data ?? response`; keep backend contract handling inside the data layer.
- Verify mobile endpoint paths match backend routes under `/api/v1`. `pulsecalapp/lib/core/config/app_config.dart` already includes `/api/v1` in `baseUrl`, so `ApiService` paths should be relative like `/auth/profile` and `/appointments`.

**Known mismatch risk:**
- `pulsecalapp/lib/core/constants/api_endpoints.dart` defines constants that include `/api/v1`, while `pulsecalapp/lib/core/config/app_config.dart` also includes `/api/v1`. Avoid combining them or requests may double-prefix the API path.
- `pulsecalapp/lib/core/constants/api_endpoints.dart` contains several route names that do not match the current backend route shape, such as appointment booking/search constants. Prefer verified endpoints in `pulsecalapp/lib/data/datasources/remote/api_service.dart`.

## Auth Guard Patterns

**Patterns:**
- App entry is `PulseCalApp` in `pulsecalapp/lib/main.dart`, with `home: const AuthWrapper()`.
- `AuthWrapper` in `pulsecalapp/lib/presentation/screens/auth/auth_wrapper.dart` watches `authProvider` and routes authenticated users by role to doctor, receptionist, or patient dashboards.
- `DashboardRouter` in `pulsecalapp/lib/presentation/screens/dashboard_router.dart` contains a similar role switch but is not the entry-point guard.
- `AuthNotifier` in `pulsecalapp/lib/presentation/providers/auth_provider.dart` checks local auth status on creation and fetches a current user through `AuthRepository`.
- `AuthRepositoryImpl.isAuthenticated` in `pulsecalapp/lib/data/repositories/auth_repository_impl.dart` requires local `isLoggedIn` plus remote token verification.

**Use this pattern for new work:**
- Put all protected mobile screens behind `AuthWrapper` or a dedicated router that reads `authProvider`.
- Use `authState.user.role` for role-specific rendering and navigation.
- Keep receptionist self-registration blocked, matching `pulsecalapp/lib/data/datasources/remote/firebase_auth_remote_datasource.dart`.
- Do not store new role state outside `AuthState`/Hive unless it is temporary UI selection state.

**Parity risk:**
- Current Firebase auth fallback paths can save Firebase-only user maps to Hive if backend sync fails. For website parity, require successful backend profile sync before setting `isAuthenticated: true`, or explicitly mark degraded/offline state.

## Logging

**Framework:** `debugPrint` / `print`

**Patterns:**
- Flutter app uses `debugPrint` in `pulsecalapp/lib/main.dart`, `pulsecalapp/lib/data/datasources/local/auth_local_datasource.dart`, and auth repository/data source files.
- Analyzer output shows `avoid_print` findings in older code paths such as `pulsecalapp/lib/data/datasources/remote/firebase_auth_remote_datasource.dart`.
- HTTP logging is enabled via `PrettyDioLogger` when `AppConfig.enableLogging` is true in `pulsecalapp/lib/core/network/dio_client.dart`.

**Use this pattern for new work:**
- Use `debugPrint` for temporary development diagnostics and remove noisy logs before shipping.
- Keep request/response body logging disabled or guarded for production and healthcare data.
- Do not log Firebase ID tokens, auth headers, patient medical details, payment signatures, or insurance data.

## Comments

**When to Comment:**
- Existing code uses section comments in `pulsecalapp/lib/data/datasources/remote/api_service.dart` for endpoint groups.
- Existing code uses doc comments for public data source/repository methods in `pulsecalapp/lib/data/datasources/remote/firebase_auth_remote_datasource.dart` and `pulsecalapp/lib/data/repositories/auth_repository_impl.dart`.
- Keep comments for backend contract assumptions, role/auth rules, and platform configuration constraints.

**JSDoc/TSDoc:**
- Not applicable to Flutter app. Use Dart doc comments (`///`) for public classes, providers, and repository/data-source methods.

## Function Design

**Size:** 
- Keep data-source API methods small and endpoint-focused.
- Avoid adding more responsibilities to `pulsecalapp/lib/data/datasources/remote/api_service.dart` without extracting helpers; it is already a large central service.
- Split large UI screens when adding parity features, especially doctor dashboard/settings and onboarding flows.

**Parameters:**
- Use named parameters for Flutter/Dart APIs with more than one optional field, matching `getAppointments`, `searchDoctors`, and auth methods.
- Prefer typed request objects or models for complex forms instead of loose `Map<String, dynamic>` when the same payload is shared across screens.

**Return Values:**
- Data sources return raw models or maps.
- Repositories return `Either<Failure, T>`.
- Providers expose UI state (`AuthState`, `AsyncValue`, or `FutureProvider` results).

## Module Design

**Exports:**
- `pulsecalapp/lib/data/models/models.dart` is a barrel file for data models.
- `NotificationModel` and `InsuranceModel` exist in `pulsecalapp/lib/data/models/notification_model.dart` and `pulsecalapp/lib/data/models/insurance_model.dart`; older analyzer output shows failures when these exports/imports were missing.
- Keep barrel exports up to date when adding new models.

**Barrel Files:**
- Use barrel files sparingly and keep them complete. Incomplete barrel exports can surface as undefined type errors in `pulsecalapp/lib/data/datasources/remote/api_service.dart`.

## Build Quality

**Current blocker commands:**
- `flutter analyze` from `pulsecalapp` currently crashes in the local Flutter toolchain because the analysis server snapshot is missing.
- `flutter test` from `pulsecalapp` currently fails because `flutter_tester` is missing from the local Flutter engine cache.
- Both commands also warn that default plugin implementation packages are missing for `path_provider` and `url_launcher`.

**Likely compile/runtime issues:**
- Local Flutter cache/toolchain is incomplete: missing `analysis_server.dart.snapshot` and `flutter_tester`.
- Android SDK path is reported missing by the Flutter crash diagnostics.
- Xcode simulator runtimes are not available according to Flutter diagnostics.
- Chrome executable is not available for web target diagnostics.
- `pulsecalapp/android/app/build.gradle.kts` signs release builds with debug signing config and keeps TODOs for application ID and signing.
- `pulsecalapp/lib/core/config/app_config.dart` contains hardcoded server URLs and placeholder Razorpay/Google Maps keys. Move environment-specific values behind build-time config before production release.
- `pulsecalapp/ios/Runner/GoogleService-Info.plist` exists and `pulsecalapp/ios/Runner/Info.plist` configures Google sign-in. Treat platform service files as sensitive configuration; do not copy values into docs or logs.

## Verification Commands

Run from `pulsecalapp`:

```bash
flutter doctor -v
flutter pub get
dart format --set-exit-if-changed .
flutter analyze
flutter test
flutter build apk --debug
flutter build ios --debug --no-codesign
```

Run only after the local Flutter cache and platform SDKs are healthy:

```bash
flutter build apk --release
flutter build ios --release --no-codesign
```

---

*Convention analysis: 2026-05-27*
