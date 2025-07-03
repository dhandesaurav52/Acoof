
import admin from 'firebase-admin';

// This service is temporarily disabled.
// The Firebase Admin SDK requires server-side configuration that can be complex.
// To resolve persistent permission errors, all admin functionality has been
// disabled in favor of a stable customer-facing application.

/*
if (!admin.apps.length) {
  try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}
*/

export default admin;
