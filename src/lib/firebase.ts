
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getDatabase, type Database } from 'firebase/database';

let firebaseConfig: any;

// On Firebase App Hosting, the config is provided automatically as an environment variable.
// This handles the configuration for deployed environments.
if (process.env.FIREBASE_CONFIG) {
    firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
} else {
    // For local development, the config is read from .env or .env.local
    // This allows you to run the app on your own machine.
    firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    };
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
