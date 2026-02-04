# Sign in with Apple - Setup for App Store Guideline 4.8

**Sign in with Apple** is implemented as an equivalent login option to satisfy [App Store Guideline 4.8](https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple). It meets all requirements:

1. **Limits data collection** to user's name and email address
2. **Allows "Hide My Email"** – users can keep their email private from all parties
3. **No ad tracking** – does not collect interactions for advertising without consent

## Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → Your Project → **Authentication** → **Sign-in method**
2. Click **Apple** → Enable the provider
3. You'll need to provide:
   - **Services ID** (from Apple Developer)
   - **Apple Team ID**
   - **Key ID**
   - **Private Key** (.p8 file content)

## Apple Developer Setup

1. **Apple Developer Program** membership required
2. Go to [Apple Developer](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles**
3. **Identifiers** → Create a **Services ID** (for web)
   - Description: e.g. "PulseCal Web"
   - Identifier: e.g. `com.yourcompany.pulsecal.web`
   - Enable **Sign In with Apple**
   - Configure domains and return URL:
     - Domain: your domain (e.g. `pulsecal.com`)
     - Return URL: `https://YOUR_FIREBASE_PROJECT_ID.firebaseapp.com/__/auth/handler`
4. **Keys** → Create a new key
   - Enable **Sign In with Apple**
   - Download the `.p8` file (only once)
   - Note the **Key ID**
5. **Identifiers** → Your App ID → **Sign In with Apple** → Configure
   - Add the Services ID
   - Add your primary App ID
6. Use your **Team ID** and **Bundle ID** / **Services ID** in Firebase

## Testing

- Sign in with Apple requires:
  - Apple ID with 2FA enabled
  - Being signed into iCloud on an Apple device (for native flows)
  - On web: works in Safari and other browsers
- Test the flow: click "Sign in with Apple" on login/signup pages

## App Store Connect Response

If Apple asks for clarification, you can reply:

> **Sign in with Apple** is available as an equivalent login option. It is shown prominently on the login and signup screens alongside Google and email/password. Sign in with Apple:
> 1. Limits data collection to the user's name and email address
> 2. Allows users to keep their email address private via "Hide My Email"
> 3. Does not collect app interactions for advertising purposes without consent
>
> The option appears as a black "Sign in with Apple" button on the auth screens.
