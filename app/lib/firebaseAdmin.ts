import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let credential;
    // Check if we have the service account in env
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      credential = admin.credential.cert(parsed);
    } else {
      // Fallback for local development if GOOGLE_APPLICATION_CREDENTIALS is set
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({
      credential,
    });
    console.log('[Firebase Admin] Initialized successfully.');
  } catch (error: any) {
    console.error('[Firebase Admin] Initialization error:', error.message);
  }
}

export const db = admin.firestore();
