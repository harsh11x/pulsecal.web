# Testing Patterns

**Analysis Date:** 2026-05-27

## Test Framework

**Runner:**
- Flutter test runner from `flutter_test`.
- Config: `pulsecalapp/pubspec.yaml` includes `flutter_test` under `dev_dependencies`.
- Analyzer config: `pulsecalapp/analysis_options.yaml`.
- No dedicated `test_config.dart`, integration test config, or CI workflow was detected for `pulsecalapp`.

**Assertion Library:**
- `flutter_test` / `package:flutter_test/flutter_test.dart`.
- Current placeholder test in `pulsecalapp/test/widget_test.dart` uses `expect(true, true)`.

**Run Commands:**
```bash
cd pulsecalapp
flutter pub get              # Restore Flutter/Dart dependencies
flutter analyze              # Static analysis and linting
flutter test                 # Run all Flutter tests
flutter test --coverage      # Run tests and collect coverage
```

**Build Verification Commands:**
```bash
cd pulsecalapp
flutter build apk --debug
flutter build ios --debug --no-codesign
flutter build apk --release
flutter build ios --release --no-codesign
```

## Test File Organization

**Location:**
- Tests live under `pulsecalapp/test`.
- Only one test file was detected: `pulsecalapp/test/widget_test.dart`.
- No `pulsecalapp/integration_test` directory was detected.
- No unit tests were detected beside data sources, repositories, providers, models, or screens.

**Naming:**
- Use Flutter/Dart standard test names: `*_test.dart`.
- Match source feature names for future tests, for example `auth_repository_impl_test.dart`, `api_service_test.dart`, `auth_wrapper_test.dart`, `appointment_model_test.dart`.

**Structure:**
```
pulsecalapp/
├── test/
│   └── widget_test.dart
├── lib/
│   ├── core/
│   ├── data/
│   ├── domain/
│   └── presentation/
└── integration_test/        # Not detected
```

## Test Structure

**Suite Organization:**
```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    expect(true, true);
  });
}
```

**Patterns:**
- Current test is a placeholder smoke test and does not pump `PulseCalApp`.
- `pulsecalapp/test/widget_test.dart` comments out `tester.pumpWidget(const PulseCalApp())`.
- There is no setup/teardown pattern in the current test suite.
- There are no repository, provider, model parsing, API envelope, or auth guard tests.

## Mocking

**Framework:** Not detected

**Patterns:**
```dart
// No mocking framework or fake data source pattern is currently present in pulsecalapp/test.
```

**What to Mock:**
- Mock or fake `DioClient` when testing `pulsecalapp/lib/data/datasources/remote/api_service.dart`.
- Mock or fake `AuthRemoteDataSource` and `AuthLocalDataSource` when testing `pulsecalapp/lib/data/repositories/auth_repository_impl.dart`.
- Mock or fake Hive `Box` for `pulsecalapp/lib/data/datasources/local/auth_local_datasource.dart`.
- Mock Firebase Auth and Google Sign-In wrappers when testing `pulsecalapp/lib/data/datasources/remote/firebase_auth_remote_datasource.dart`.
- Use provider overrides for Riverpod tests, matching the app's `ProviderScope` override style in `pulsecalapp/lib/main.dart`.

**What NOT to Mock:**
- Do not mock model `fromJson` constructors when testing API parsing; malformed backend payloads should fail in tests.
- Do not mock role routing logic in `pulsecalapp/lib/presentation/screens/auth/auth_wrapper.dart`; test the role-to-dashboard behavior directly with provider overrides.
- Do not hit the production backend IP from unit tests. Keep live API verification as a manual or dedicated integration check with a non-production environment.

## Fixtures and Factories

**Test Data:**
```dart
final wrappedUserResponse = {
  'success': true,
  'message': 'Success',
  'data': {
    'id': 'user_1',
    'email': 'patient@example.com',
    'role': 'PATIENT',
  },
};
```

**Location:**
- No fixture directory exists.
- Add reusable fixtures under `pulsecalapp/test/fixtures` or close to the tested feature under `pulsecalapp/test/<feature>`.
- Use backend response shapes from `backend/src/utils/apiResponse.ts` and verified API methods in `pulsecalapp/lib/data/datasources/remote/api_service.dart`.

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
cd pulsecalapp
flutter test --coverage
```

**Coverage State:**
- Current coverage is effectively absent because the only test asserts `true`.
- There is no coverage threshold in `pulsecalapp`, no CI coverage gate, and no coverage reporting config.

## Test Types

**Unit Tests:**
- Current status: Not present for app logic.
- Add tests for model JSON parsing in `pulsecalapp/lib/data/models`, especially nullable fields and backend naming differences.
- Add tests for `ApiService` response envelope parsing in `pulsecalapp/lib/data/datasources/remote/api_service.dart`.
- Add tests for exception-to-failure mapping in `pulsecalapp/lib/data/repositories/auth_repository_impl.dart`.
- Add tests for local token/user persistence in `pulsecalapp/lib/data/datasources/local/auth_local_datasource.dart`.

**Widget Tests:**
- Current status: Placeholder only in `pulsecalapp/test/widget_test.dart`.
- Add widget tests for `AuthWrapper` in `pulsecalapp/lib/presentation/screens/auth/auth_wrapper.dart`.
- Add role-routing tests for patient, doctor, and receptionist dashboard selection.
- Add loading and unauthenticated-state tests for splash/login rendering.

**Integration Tests:**
- Current status: Not used.
- Add `pulsecalapp/integration_test` only after the app can build and a non-production backend/database is available.
- Prioritize flows needed for website parity: Firebase login, profile sync, role guard, appointment list/create, notifications, doctor/receptionist views, and logout.

**E2E Tests:**
- Framework: Not used.
- No Detox/Appium/Flutter Driver or `integration_test` automation exists.

## Common Patterns

**Async Testing:**
```dart
test('maps auth failures to AuthFailure', () async {
  final result = await repository.signInWithEmailPassword(
    email: 'patient@example.com',
    password: 'password',
    role: 'patient',
  );

  expect(result.isLeft(), isTrue);
});
```

**Widget Testing With Providers:**
```dart
await tester.pumpWidget(
  ProviderScope(
    overrides: [
      // Override auth/provider dependencies here.
    ],
    child: const MaterialApp(home: AuthWrapper()),
  ),
);
```

**Error Testing:**
```dart
expect(
  () async => apiService.getAppointmentById('missing'),
  throwsA(isA<AppException>()),
);
```

## Analyzer and Lint Quality

**Config:**
- `pulsecalapp/analysis_options.yaml` includes `package:flutter_lints/flutter.yaml`.
- `pulsecalapp/pubspec.yaml` pins Dart SDK to `^3.9.2` and `flutter_lints` to `^5.0.0`.

**Observed analyzer outputs:**
- `pulsecalapp/flutter_analyze_output_recent.txt` records 175 issues, mostly info/warning level.
- `pulsecalapp/analyze_output.txt` records an older 42-issue run with hard errors such as undefined `NotificationModel`, undefined `InsuranceModel`, undefined `authProvider`, missing `_isEditing`/`_isSaving`, and `ChatParticipant.photoUrl` getter mismatches.

**Current command result:**
- Running `flutter analyze` from `pulsecalapp` failed before completing analysis because the local Flutter toolchain is missing `analysis_server.dart.snapshot`.
- The same run reported missing default plugin implementation packages for `path_provider` and `url_launcher`.

**Do not treat old analyzer logs as authoritative after code changes.**
- First repair the local Flutter SDK/cache and run a fresh `flutter analyze`.
- Then fix compile errors before addressing lint/info findings.

## Build Scripts

**Detected scripts:**
- Flutter uses standard CLI commands from `pulsecalapp`; no custom shell scripts, Makefile, Fastlane config, or CI workflow was detected for the mobile app.
- Android Gradle wrapper exists in `pulsecalapp/android/gradlew`.
- CocoaPods config exists in `pulsecalapp/ios/Podfile`.

**Expected commands:**
```bash
cd pulsecalapp
flutter clean
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter analyze
flutter test
flutter build apk --debug
flutter build ios --debug --no-codesign
```

**Code generation command:**
- Use only if generated annotations are present or added:
```bash
cd pulsecalapp
dart run build_runner build --delete-conflicting-outputs
```

## Platform Config

**Android:**
- Config files: `pulsecalapp/android/settings.gradle.kts`, `pulsecalapp/android/build.gradle.kts`, `pulsecalapp/android/app/build.gradle.kts`, `pulsecalapp/android/app/src/main/AndroidManifest.xml`.
- Android plugin: `com.android.application` version `8.9.1`.
- Kotlin plugin: `org.jetbrains.kotlin.android` version `2.1.0`.
- Google services plugin: `com.google.gms.google-services` version `4.3.15`.
- Namespace/application ID: `com.pulsecal.pulsecal_mobile`.
- Manifest includes `android.permission.INTERNET`.
- Release build currently uses debug signing in `pulsecalapp/android/app/build.gradle.kts`; this blocks production release readiness.

**iOS:**
- Config files: `pulsecalapp/ios/Podfile`, `pulsecalapp/ios/Runner/Info.plist`, `pulsecalapp/ios/Runner/GoogleService-Info.plist`.
- iOS deployment target: `14.0`.
- `use_frameworks!` is enabled in `pulsecalapp/ios/Podfile`.
- Google sign-in URL scheme and client ID are configured in `pulsecalapp/ios/Runner/Info.plist`.
- Treat `pulsecalapp/ios/Runner/GoogleService-Info.plist` as sensitive platform configuration and avoid quoting contents.

## Critical Blockers

**Local toolchain blocker:**
- `flutter analyze` fails due to missing Flutter analysis server snapshot in the local Flutter SDK cache.
- `flutter test` fails due to missing `flutter_tester` in the local Flutter engine cache.
- Flutter diagnostics embedded in the crash output also report a missing Android SDK path, unavailable Xcode simulator runtimes, and missing Chrome executable.

**Dependency/plugin blocker:**
- Flutter commands warn that `path_provider` and `url_launcher` reference default implementation packages that are missing or not plugin packages.
- Run `flutter clean`, repair/refresh the Flutter SDK, and run `flutter pub get` before trusting analyzer/test/build output.

**Test blocker:**
- The only test in `pulsecalapp/test/widget_test.dart` is a placeholder. It does not verify app boot, auth routing, API parsing, backend parity, or role-based dashboards.

**Runtime parity blocker:**
- Auth data sources in `pulsecalapp/lib/data/datasources/remote/firebase_auth_remote_datasource.dart` can bypass backend sync failures and still return local fallback user maps.
- This can create mobile sessions that are not backed by the website's backend/database/account state.

**Build release blocker:**
- `pulsecalapp/android/app/build.gradle.kts` uses debug signing for release builds.
- `pulsecalapp/lib/core/config/app_config.dart` contains hardcoded backend URLs and placeholder production keys.

---

*Testing analysis: 2026-05-27*
