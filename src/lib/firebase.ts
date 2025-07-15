
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getDatabase, type Database } from 'firebase/database';

let firebaseConfig: any;

// For local development and client-side on production, the config is read from NEXT_PUBLIC_ variables.
// These are exposed to the browser and are the primary source of configuration.
const clientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// On Firebase App Hosting, the server-side runtime gets the config automatically.
// We use this as a fallback if the public keys aren't set for some reason.
const serverConfig = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : null;

// Prioritize client-side public variables, as they are essential for the browser.
if (clientConfig.apiKey) {
    firebaseConfig = clientConfig;
} else {
    firebaseConfig = serverConfig;
}


let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let database: Database | null = null;

// Initialize Firebase only if the config is valid.
if (firebaseConfig && firebaseConfig.apiKey) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        storage = getStorage(app);
        database = getDatabase(app);
    } catch (e) {
        console.error("Failed to initialize Firebase", e);
    }
} else {
    // This warning helps developers running the app locally without a .env file.
    console.warn("Firebase configuration is missing or incomplete. Firebase features will be disabled. If you are running locally, please create a .env.local file with your Firebase project credentials.");
}


export { app, auth, storage, database };
