
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

let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;
let database: Database;

// This is a more robust way to initialize Firebase on the client-side.
// It ensures that we don't try to re-initialize the app if it's already been set up.
if (firebaseConfig.apiKey) {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    auth = getAuth(app);
    storage = getStorage(app);
    database = getDatabase(app);
} else {
    // This warning helps developers running the app locally without a .env file.
    console.warn("Firebase configuration is missing or incomplete. Firebase client-side features will be disabled. If you are running locally, please create a .env.local file with your Firebase project's NEXT_PUBLIC_ credentials.");
}

export { app, auth, storage, database };
