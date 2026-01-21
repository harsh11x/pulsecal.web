# Project Audit: Bugs, Vulnerabilities, and To-Do List

## Critical Vulnerabilities

1.  **Privilege Escalation (Auth Controller)**
    *   **File:** `backend/src/modules/auth/auth.controller.ts`
    *   **Issue:** The `syncProfileController` allows any authenticated user to change their role to `DOCTOR` or `RECEPTIONIST` by including the `role` field in the request body.
    *   **Fix:** Remove the logic that updates `role` from the user input in this controller.

2.  **Insecure Direct Object Reference (IDOR) in Medical Records**
    *   **File:** `backend/src/modules/medicalRecords/medicalRecords.service.ts`
    *   **Issue:** `updateMedicalRecord` and `deleteMedicalRecord` do not verify if the requesting user owns the record or has specific permissions to modify it. Any doctor can modify/delete any medical record.
    *   **Fix:** Add ownership checks or strict RBAC (Role-Based Access Control) in the service methods.

3.  **Impersonation Risk (Medical Records)**
    *   **File:** `backend/src/modules/medicalRecords/medicalRecords.controller.ts`
    *   **Issue:** `createMedicalRecordController` allows the `doctorId` to be set from the request body. A malicious doctor could attribute a medical record to another doctor.
    *   **Fix:** Force `doctorId` to be the current user's ID when the user is a doctor.

4.  **Implicit Role Assignment**
    *   **File:** `backend/src/middlewares/firebaseAuth.middleware.ts`
    *   **Issue:** The middleware blindly trusts the `role` claim from the Firebase token during user creation (`const role = (decodedToken.role as string) || 'PATIENT'`). If the Firebase token claims can be manipulated or are not strictly controlled, this allows unauthorized role assignment.
    *   **Fix:** Default to `PATIENT` for all auto-created users.

## Configuration & Security Best Practices

1.  **Hardcoded Secrets**
    *   **File:** `backend/src/config/env.ts`
    *   **Issue:** `sessionSecret` has a default value (`'super-secret-session-key'`).
    *   **Action:** Ensure `SESSION_SECRET` is required in production or generate a random one on startup if not provided (though persistence issues might arise). Warn if default is used.

2.  **Sensitive Data Logging**
    *   **File:** `backend/src/middlewares/firebaseAuth.middleware.ts`
    *   **Issue:** Logs `Authorization` header partial content. `logger.warn` logs all headers if auth header is missing.
    *   **Action:** Redact sensitive headers in logs.

3.  **Missing Security Headers**
    *   **Issue:** While `helmet` is used, Content Security Policy (CSP) and other specific headers should be configured for the specific needs of the application.

## Missing Features & Technical Debt

1.  **Testing**
    *   **Issue:** Lack of comprehensive unit and integration tests. `jest` is installed but no test files were observed in key modules.
    *   **Action:** Create a test suite for Auth, User, and Medical Record modules.

2.  **API Documentation**
    *   **Issue:** No Swagger/OpenAPI documentation found.
    *   **Action:** Integrate `swagger-ui-express` and document API endpoints.

3.  **Input Validation**
    *   **Issue:** While Joi/Zod is used, some validations are loose (e.g., `doctorId` in medical records).
    *   **Action:** Review all schemas for strict validation.

4.  **Audit Logging Coverage**
    *   **Issue:** `audit.middleware.ts` exists but it is not clear if it's applied globally or consistently across all critical actions.
    *   **Action:** Ensure audit logging is applied to all write operations (Create, Update, Delete).

5.  **Rate Limiting Granularity**
    *   **Issue:** Global rate limiter exists, but sensitive endpoints (auth, password reset) might need stricter limits.

6.  **Data Retention Policy**
    *   **Issue:** `deleteMedicalRecord` performs a soft delete (`deletedAt`). There is no mechanism to permanently purge old data or handle "Right to be Forgotten" fully.

## Frontend (Brief Overview)

*   **Review Needed:** Check `app/` and `components/` for client-side security issues (XSS, sensitive data in local storage).
*   **Missing:** E2E tests (e.g., Playwright/Cypress).
