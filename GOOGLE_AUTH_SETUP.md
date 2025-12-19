# Google Authentication Setup Guide

This guide explains how Google authentication is integrated in PulseCal.

## Features

✅ **Login**: Users can sign in with email/password OR Google  
✅ **Signup**: Users can create account with email/password OR Google  
✅ **Automatic Profile Sync**: Google account info (name, photo) automatically synced to backend

## Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `pulsecal-72bb4`
3. Go to **Authentication** → **Sign-in method**
4. Enable **Google** provider:
   - Click on Google
   - Toggle "Enable"
   - Add your support email
   - Save

## Components Created

### 1. `GoogleSignInButton.tsx`
A reusable button component for Google authentication that:
- Works for both sign-in and sign-up
- Shows loading state
- Handles errors
- Automatically syncs profile with backend

### 2. `AuthForm.tsx`
A complete authentication form that includes:
- Google sign-in button
- Email/password form
- Form validation
- Error handling
- Loading states

## Usage

### Option 1: Use the Complete AuthForm Component

```tsx
import { AuthForm } from "@/components/auth/AuthForm"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthForm mode="signin" />
    </div>
  )
}
```

### Option 2: Use Individual Components

```tsx
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { signIn, signInWithGoogle } from "@/lib/firebaseAuth"

export default function LoginPage() {
  const handleEmailLogin = async (email: string, password: string) => {
    await signIn(email, password)
  }

  const handleGoogleSuccess = () => {
    router.push("/dashboard")
  }

  return (
    <div>
      {/* Email/Password Form */}
      <form onSubmit={handleEmailLogin}>
        {/* Your form fields */}
      </form>

      {/* Google Button */}
      <GoogleSignInButton
        mode="signin"
        onSuccess={handleGoogleSuccess}
      />
    </div>
  )
}
```

### Option 3: Direct Function Calls

```tsx
import { signIn, signInWithGoogle, syncUserProfile } from "@/lib/firebaseAuth"

// Email/Password Login
const handleEmailLogin = async () => {
  await signIn(email, password)
}

// Google Login
const handleGoogleLogin = async () => {
  const userCredential = await signInWithGoogle()
  // Profile automatically synced (name, photo from Google)
  await syncUserProfile()
}

// Google Signup (same as login - creates account if doesn't exist)
const handleGoogleSignup = async () => {
  const userCredential = await signUpWithGoogle()
  await syncUserProfile()
}
```

## How It Works

### Email/Password Flow

1. User enters email and password
2. Firebase authenticates
3. Backend syncs user profile
4. User redirected to dashboard

### Google Flow

1. User clicks "Sign in with Google"
2. Google OAuth popup appears
3. User selects Google account
4. Firebase creates/updates user
5. Backend automatically syncs:
   - Name from Google account
   - Profile photo from Google
   - Email from Google
6. User redirected to dashboard

## Backend Integration

The backend automatically:
- Creates user in database if doesn't exist
- Syncs name from Google account
- Syncs profile photo from Google
- Links Firebase UID to database user

No additional backend changes needed!

## Error Handling

The components handle common errors:
- `auth/user-not-found` - No account found
- `auth/wrong-password` - Incorrect password
- `auth/email-already-in-use` - Email already registered
- `auth/weak-password` - Password too weak
- `auth/popup-closed-by-user` - User closed Google popup

## Testing

1. **Test Email/Password Login:**
   - Go to `/auth/login`
   - Enter email and password
   - Should redirect to dashboard

2. **Test Google Login:**
   - Go to `/auth/login`
   - Click "Sign in with Google"
   - Select Google account
   - Should redirect to dashboard

3. **Test Email/Password Signup:**
   - Go to `/auth/signup`
   - Enter name, email, password
   - Should create account and redirect

4. **Test Google Signup:**
   - Go to `/auth/signup`
   - Click "Sign up with Google"
   - Select Google account
   - Should create account and redirect

## Customization

### Customize Google Button Text

```tsx
<GoogleSignInButton
  mode="signin"
  buttonText="Continue with Google" // Custom text
/>
```

### Add Additional Scopes

Edit `lib/firebaseAuth.ts`:

```typescript
provider.addScope('https://www.googleapis.com/auth/calendar.readonly')
```

## Security Notes

- Google OAuth uses secure popup window
- Tokens are managed by Firebase
- No passwords stored for Google accounts
- All authentication handled by Firebase

## Troubleshooting

### "Google sign-in not working"
- Check Firebase Console → Authentication → Sign-in method → Google is enabled
- Verify OAuth consent screen is configured in Google Cloud Console

### "Profile not syncing"
- Check backend logs
- Verify `FIREBASE_SERVICE_ACCOUNT_KEY` is set correctly
- Check network tab for API calls

### "Popup blocked"
- Browser may block popups
- User needs to allow popups for your domain
- Consider using redirect flow instead of popup

## Next Steps

1. Enable Google provider in Firebase Console
2. Update your login/signup pages to use `AuthForm` component
3. Test both authentication methods
4. Customize UI as needed

