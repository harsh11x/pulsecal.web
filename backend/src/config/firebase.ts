import admin from 'firebase-admin';
import { logger } from '../utils/logger';

if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : undefined;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // For environments where service account key is not available
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      throw new Error('Firebase configuration not found');
    }

    logger.info('Firebase Admin initialized successfully');
  } catch (error) {
    logger.error('Firebase initialization error:', error);
    throw error;
  }
}

export default admin;

