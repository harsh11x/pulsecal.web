import { logger } from './logger';

const FIREBASE_WEB_API_KEY =
  process.env.FIREBASE_WEB_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  'AIzaSyAvP51E08sZXZdks8fkDBG6IgVZslhsfV4';

type FirebaseRestError = { error?: { message?: string } };

/**
 * Create a Firebase Auth user via Identity Toolkit REST.
 * Used as fallback when Admin SDK credentials are unavailable/revoked.
 */
export async function createFirebaseUserViaRest(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<{ uid: string }> {
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_WEB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        displayName: input.displayName,
        returnSecureToken: true,
      }),
    }
  );
  const data = (await resp.json()) as {
    localId?: string;
    error?: { message?: string };
  };

  if (!resp.ok || !data.localId) {
    const message = data.error?.message || `HTTP ${resp.status}`;
    logger.warn({ email: input.email, message }, 'Firebase REST signUp failed');
    throw new Error(message);
  }

  return { uid: data.localId };
}

/**
 * Verify email/password and return an ID token via Identity Toolkit REST.
 */
export async function signInFirebaseViaRest(input: {
  email: string;
  password: string;
}): Promise<{ idToken: string; localId: string }> {
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        returnSecureToken: true,
      }),
    }
  );
  const data = (await resp.json()) as {
    idToken?: string;
    localId?: string;
  } & FirebaseRestError;

  if (!resp.ok || !data.idToken || !data.localId) {
    const message = data.error?.message || `HTTP ${resp.status}`;
    logger.warn({ email: input.email, message }, 'Firebase REST signIn failed');
    throw new Error(message);
  }

  return { idToken: data.idToken, localId: data.localId };
}

/**
 * Update password for a signed-in Firebase user via Identity Toolkit REST.
 * Requires a fresh idToken from signInWithPassword / refresh.
 */
export async function updateFirebasePasswordViaRest(input: {
  idToken: string;
  newPassword: string;
}): Promise<void> {
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_WEB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: input.idToken,
        password: input.newPassword,
        returnSecureToken: false,
      }),
    }
  );
  const data = (await resp.json()) as FirebaseRestError;

  if (!resp.ok) {
    const message = data.error?.message || `HTTP ${resp.status}`;
    logger.warn({ message }, 'Firebase REST password update failed');
    throw new Error(message);
  }
}

/**
 * Change password by verifying current password then updating via REST.
 * Works without Firebase Admin SDK.
 */
export async function changeFirebasePasswordViaRest(input: {
  email: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const { idToken } = await signInFirebaseViaRest({
    email: input.email,
    password: input.currentPassword,
  });
  await updateFirebasePasswordViaRest({
    idToken,
    newPassword: input.newPassword,
  });
}
