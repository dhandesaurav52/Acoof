
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getDatabase, type Database } from 'firebase/database';

// The client-side Firebase configuration is read from NEXT_PUBLIC_ environment variables.
// These variables are embedded at build time and are the sole source of configuration for the browser.
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let database: Database | null = null;

// Initialize Firebase only if the config is valid and present.
if (firebaseConfig && firebaseConfig.apiKey) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        storage = getStorage(app);
        database = getDatabase(app);
    } catch (e) {
        console.error("Failed to initialize Firebase client SDK.", e);
    }
} else {
    // This warning helps developers running the app locally without a .env file.
    console.warn("Firebase configuration is missing or incomplete. Firebase client-side features will be disabled. If you are running locally, please create a .env.local file with your Firebase project's NEXT_PUBLIC_ credentials.");
}


export { app, auth, storage, database };
