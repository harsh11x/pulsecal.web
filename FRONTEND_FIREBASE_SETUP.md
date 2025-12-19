# Frontend Firebase Setup - PulseCal

This guide shows how Firebase Authentication is integrated in the PulseCal frontend.

## Files Created

1. **`lib/firebase.ts`** - Firebase app initialization with your project configuration
2. **`lib/firebaseAuth.ts`** - Authentication helper functions
3. **`lib/logger.ts`** - Simple logging utility

## Firebase Configuration

Your Firebase config is already set up in `lib/firebase.ts` with:
- Project ID: `pulsecal-72bb4`
- Auth Domain: `pulsecal-72bb4.firebaseapp.com`
- All necessary API keys and configuration

## Usage Examples

### Sign Up

```typescript
import { signUp, syncUserProfile } from '@/lib/firebaseAuth';

const handleSignUp = async (email: string, password: string, firstName: string, lastName: string) => {
  try {
    // Sign up with Firebase
    const userCredential = await signUp(email, password, `${firstName} ${lastName}`);
    
    // Sync profile with backend
    await syncUserProfile(firstName, lastName);
    
    // Redirect to dashboard
    router.push('/dashboard');
  } catch (error) {
    console.error('Sign up error:', error);
  }
};
```

### Sign In

```typescript
import { signIn } from '@/lib/firebaseAuth';

const handleSignIn = async (email: string, password: string) => {
  try {
    await signIn(email, password);
    router.push('/dashboard');
  } catch (error) {
    console.error('Sign in error:', error);
  }
};
```

### Sign Out

```typescript
import { logOut } from '@/lib/firebaseAuth';

const handleSignOut = async () => {
  await logOut();
  router.push('/auth/login');
};
```

### Making API Requests

The API service (`services/api.ts`) is already configured to automatically:
1. Get Firebase ID token
2. Add it to Authorization header
3. Handle token refresh

Just use the API service normally:

```typescript
import { apiService } from '@/services/api';

// Token is automatically added
const appointments = await apiService.get('/appointments');
```

### Socket.IO Connection

Update your socket connection to use Firebase tokens:

```typescript
import { socketService } from '@/services/socket';

// Connect with Firebase token (automatically retrieved)
await socketService.connect();
```

## Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

For production (Vercel):

```env
NEXT_PUBLIC_API_URL=https://your-aws-backend-url.com
NEXT_PUBLIC_SOCKET_URL=https://your-aws-backend-url.com
```

## Integration with Existing Auth Pages

Update your auth pages (`app/auth/login/page.tsx`, `app/auth/signup/page.tsx`) to use Firebase:

```typescript
'use client';

import { signIn, signUp, syncUserProfile } from '@/lib/firebaseAuth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error.message);
    }
  };

  // ... rest of component
}
```

## Token Management

Firebase tokens are automatically:
- Retrieved when needed
- Refreshed when expired (Firebase handles this)
- Added to all API requests via interceptors
- Used for Socket.IO connections

No manual token storage needed!

## Next Steps

1. Update your login/signup pages to use `signIn` and `signUp` functions
2. Add profile sync after signup using `syncUserProfile`
3. Update protected routes to check Firebase auth state
4. Test the integration with your AWS backend

## Testing

1. Sign up a new user
2. Check Firebase Console → Authentication → Users
3. Check backend database for new user record
4. Make API request - should work automatically
5. Connect Socket.IO - should authenticate automatically

