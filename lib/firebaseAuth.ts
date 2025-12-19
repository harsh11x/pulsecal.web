import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { auth, getAuthInstance } from './firebase';
import { logger } from './logger';

/**
 * Sign up a new user with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> => {
  try {
    const authInstance = getAuthInstance();
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    
    // Update display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });
    }
    
    return userCredential;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

/**
 * Sign up with Google (same as sign in, but creates account if doesn't exist)
 */
export const signUpWithGoogle = async (): Promise<UserCredential> => {
  try {
    // Google sign-in automatically creates account if it doesn't exist
    return await signInWithGoogle();
  } catch (error) {
    console.error('Google sign up error:', error);
    throw error;
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const authInstance = getAuthInstance();
    return await signInWithEmailAndPassword(authInstance, email, password);
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      throw new Error('Google authentication is only available on the client side');
    }

    // Check if sessionStorage is available (required for Firebase popup flow)
    try {
      const testKey = '__firebase_auth_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
    } catch (storageError) {
      throw new Error('Session storage is not available. Please enable cookies and storage for this site.');
    }

    // Get auth instance (will throw if not available)
    const authInstance = getAuthInstance();
    
    const provider = new GoogleAuthProvider();
    // Request additional scopes if needed
    provider.addScope('profile');
    provider.addScope('email');
    
    // Set custom parameters
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Use signInWithPopup with better error handling
    let result: UserCredential;
    try {
      result = await signInWithPopup(authInstance, provider);
    } catch (popupError: any) {
      // Handle specific Firebase errors
      if (popupError.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      } else if (popupError.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled.');
      } else if (popupError.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection.');
      } else if (popupError.message?.includes('initial state') || popupError.message?.includes('sessionStorage')) {
        throw new Error('Authentication state error. Please try again or refresh the page.');
      }
      throw popupError;
    }
    
    // Wait a moment for Firebase to fully process the authentication
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Ensure we have a user
    if (!result.user || !result.user.uid) {
      throw new Error('Google authentication completed but user data is missing');
    }
    
    // Verify the user is actually authenticated in Firebase
    if (authInstance.currentUser?.uid !== result.user.uid) {
      // Wait a bit more and check again
      await new Promise(resolve => setTimeout(resolve, 300));
      if (authInstance.currentUser?.uid !== result.user.uid) {
        throw new Error('Authentication state mismatch. Please try again.');
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('Google sign in error:', error);
    // Re-throw with more context
    if (error.code) {
      throw error; // Firebase error with code
    }
    throw new Error(`Google sign in failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Sign out current user
 */
export const logOut = async (): Promise<void> => {
  try {
    const authInstance = getAuthInstance();
    await signOut(authInstance);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    const authInstance = getAuthInstance();
    await sendPasswordResetEmail(authInstance, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Get Firebase ID token for API requests
 */
export const getIdToken = async (forceRefresh: boolean = false): Promise<string | null> => {
  try {
    const authInstance = getAuthInstance();
    const user = authInstance.currentUser;
    if (!user) {
      return null;
    }
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error('Get ID token error:', error);
    return null;
  }
};

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
  try {
    const authInstance = getAuthInstance();
    return authInstance.currentUser;
  } catch {
    return null;
  }
};

/**
 * Get ID token with retry logic (useful after Google signup)
 */
const getIdTokenWithRetry = async (maxRetries = 3, delay = 500): Promise<string | null> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const token = await getIdToken(true); // Force refresh
      if (token) {
        return token;
      }
    } catch (error) {
      console.warn(`Token retrieval attempt ${i + 1} failed:`, error);
    }
    
    if (i < maxRetries - 1) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
};

/**
 * Sync user profile with backend after authentication
 * Automatically extracts name from Firebase user if not provided
 */
export const syncUserProfile = async (
  firstName?: string,
  lastName?: string,
  phone?: string,
  dateOfBirth?: Date,
  profileImage?: string,
  role?: "PATIENT" | "DOCTOR" | "RECEPTIONIST"
): Promise<void> => {
  try {
    // Wait a bit for Firebase to fully initialize the user
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify user is authenticated
    const user = getCurrentUser();
    if (!user || !user.uid) {
      // Wait a bit more and retry
      await new Promise(resolve => setTimeout(resolve, 500));
      const retryUser = getCurrentUser();
      if (!retryUser || !retryUser.uid) {
        throw new Error('User not found. Please try signing in again.');
      }
    }
    
    // Get token with retry logic
    const token = await getIdTokenWithRetry(5, 500);
    if (!token) {
      throw new Error('No authentication token available. Please try signing in again.');
    }
    
    // If name not provided, try to extract from Firebase user
    let finalFirstName = firstName;
    let finalLastName = lastName;
    let finalProfileImage = profileImage;

    if (user) {
      // Try displayName first, then email prefix
      if (!finalFirstName && !finalLastName) {
        if (user.displayName) {
          const nameParts = user.displayName.split(' ');
          finalFirstName = nameParts[0] || '';
          finalLastName = nameParts.slice(1).join(' ') || '';
        } else if (user.email) {
          // Fallback to email prefix if no display name
          const emailPrefix = user.email.split('@')[0];
          finalFirstName = emailPrefix;
          finalLastName = '';
        }
      }
      
      if (!finalProfileImage && user.photoURL) {
        finalProfileImage = user.photoURL;
      }
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${apiUrl}/api/v1/auth/sync-profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: finalFirstName,
        lastName: finalLastName,
        phone,
        dateOfBirth: dateOfBirth?.toISOString(),
        profileImage: finalProfileImage,
        role: role, // Include role if provided
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to sync profile' }));
      throw new Error(errorData.message || `Failed to sync profile: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Sync profile error:', error);
    throw error;
  }
};

