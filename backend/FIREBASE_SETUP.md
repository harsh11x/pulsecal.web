# Firebase Authentication Setup Guide

This guide explains how to set up Firebase Authentication for PulseCal.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "PulseCal"
4. Enable Google Analytics (optional)
5. Create project

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** sign-in method
4. Optionally enable other providers:
   - Google
   - Facebook
   - Apple
   - etc.

## Step 3: Get Service Account Key

1. Go to **Project Settings** (gear icon)
2. Click **Service Accounts** tab
3. Click **Generate new private key**
4. Save the JSON file securely
5. Copy the entire JSON content

## Step 4: Configure Backend

Add the service account key to your `.env` file:

```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**Important**: 
- The entire JSON must be on a single line
- Wrap it in single quotes
- Escape any single quotes inside the JSON

Alternatively, you can set it as an environment variable in AWS without quotes.

## Step 5: Configure Frontend (Vercel)

In your Next.js frontend, install Firebase:

```bash
npm install firebase
```

Create `lib/firebase.ts`:

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
```

Add to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Get these values from Firebase Console → Project Settings → General.

## Step 6: Set Custom Claims (Optional)

To set user roles in Firebase, use Firebase Admin SDK in your backend:

```typescript
import admin from './config/firebase';

// Set role for a user
await admin.auth().setCustomUserClaims(uid, { role: 'DOCTOR' });
```

Or use a Cloud Function:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.setUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be admin');
  }
  
  await admin.auth().setCustomUserClaims(data.uid, { role: data.role });
  return { success: true };
});
```

## Step 7: Frontend Authentication Flow

### Sign Up

```typescript
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const signUp = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  
  // Sync profile with backend
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/sync-profile`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firstName: 'John',
      lastName: 'Doe',
    }),
  });
};
```

### Sign In

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';

const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  
  // Store token for API requests
  localStorage.setItem('firebaseToken', token);
};
```

### API Requests

```typescript
const token = await auth.currentUser?.getIdToken();

const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

## Step 8: Socket.IO Authentication

For Socket.IO connections, pass the Firebase token:

```typescript
import { io } from 'socket.io-client';

const token = await auth.currentUser?.getIdToken();

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
  auth: {
    token: token,
  },
  extraHeaders: {
    Authorization: `Bearer ${token}`,
  },
});
```

## Security Best Practices

1. **Never expose service account key** in frontend code
2. **Use environment variables** for all Firebase config
3. **Enable Firebase App Check** for production
4. **Set up Firebase Security Rules** for Firestore (if used)
5. **Monitor authentication** in Firebase Console
6. **Use HTTPS** for all API calls

## Troubleshooting

### "Firebase configuration not found"
- Check `FIREBASE_SERVICE_ACCOUNT_KEY` is set correctly
- Verify JSON is valid and properly escaped

### "Invalid token" errors
- Ensure token is fresh (Firebase tokens expire after 1 hour)
- Check token is being sent in Authorization header
- Verify Firebase project ID matches

### User not created in database
- Check backend logs for errors
- Verify database connection
- Check Prisma migrations are run

## Testing

Test authentication flow:

1. Sign up a new user in frontend
2. Check Firebase Console → Authentication → Users
3. Check backend database for new user record
4. Make API request with token
5. Verify user data is synced

## Production Checklist

- [ ] Firebase project created
- [ ] Authentication enabled
- [ ] Service account key configured in backend
- [ ] Frontend Firebase config added
- [ ] Custom claims set for roles (if needed)
- [ ] API endpoints tested with Firebase tokens
- [ ] Socket.IO connections tested
- [ ] Error handling implemented
- [ ] Security rules configured

