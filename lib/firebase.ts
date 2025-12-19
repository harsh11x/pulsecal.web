import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvP51E08sZXZdks8fkDBG6IgVZslhsfV4",
  authDomain: "pulsecal-72bb4.firebaseapp.com",
  projectId: "pulsecal-72bb4",
  storageBucket: "pulsecal-72bb4.firebasestorage.app",
  messagingSenderId: "375873590290",
  appId: "1:375873590290:web:847716fd25fc8f05de74cb",
  measurementId: "G-7SXLKFL822"
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  // Only initialize on client side
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    auth = getAuth(app);
    
    // Initialize Analytics only in browser
    if (typeof window !== 'undefined') {
      try {
        analytics = getAnalytics(app);
      } catch (analyticsError) {
        console.warn('Analytics initialization failed:', analyticsError);
      }
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

// Export with proper types
export { app, analytics };

// Export auth with a getter that ensures it's available on client
export const getAuthInstance = (): Auth => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase auth is only available on the client side');
  }
  if (!auth) {
    throw new Error('Firebase auth is not initialized. Please refresh the page.');
  }
  return auth;
};

// Export auth directly (may be null on server)
export { auth };

