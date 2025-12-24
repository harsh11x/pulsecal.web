import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

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

// Check browser storage availability
const checkStorageAvailability = (): { localStorage: boolean; sessionStorage: boolean; indexedDB: boolean } => {
  const result = { localStorage: false, sessionStorage: false, indexedDB: false };

  try {
    const testKey = '__firebase_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    result.localStorage = true;
  } catch (e) {
    console.error('❌ localStorage is not available:', e);
  }

  try {
    const testKey = '__firebase_test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    result.sessionStorage = true;
  } catch (e) {
    console.error('❌ sessionStorage is not available:', e);
  }

  try {
    result.indexedDB = !!window.indexedDB;
    if (!result.indexedDB) {
      console.error('❌ IndexedDB is not available');
    }
  } catch (e) {
    console.error('❌ IndexedDB check failed:', e);
  }

  return result;
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;

if (typeof window !== 'undefined') {
  console.log('🔧 Initializing Firebase...');

  // Check storage availability
  const storage = checkStorageAvailability();
  console.log('📦 Storage availability:', storage);

  if (!storage.localStorage || !storage.sessionStorage) {
    console.error('⚠️ WARNING: Browser storage is not fully available. Firebase authentication may fail.');
    console.error('Please enable cookies and storage in your browser settings.');
  }

  try {
    // Only initialize on client side
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    console.log('✅ Firebase initialized successfully');
    console.log('🔑 Auth domain:', firebaseConfig.authDomain);
    console.log('📍 Project ID:', firebaseConfig.projectId);

    // Initialize Analytics only in browser
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      try {
        getAnalytics(app);
        console.log('📊 Analytics initialized');
      } catch (error) {
        console.warn('⚠️ Analytics initialization failed:', error);
      }
    }
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
} else {
  // Server-side placeholder
  app = {} as FirebaseApp;
  auth = {} as Auth;
}


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

