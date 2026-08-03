import { logger } from './logger';

const FIREBASE_WEB_API_KEY =
  process.env.FIREBASE_WEB_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  'AIzaSyAvP51E08sZXZdks8fkDBG6IgVZslhsfV4';

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
