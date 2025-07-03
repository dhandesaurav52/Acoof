
import admin from 'firebase-admin';

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

export default admin;
