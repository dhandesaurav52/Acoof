
import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;
let database: admin.database.Database | null = null;
let auth: admin.auth.Auth | null = null;
let storage: admin.storage.Storage | null = null;

const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Only initialize the admin SDK if the required variables are present.
// This prevents crashes during local development if the keys are not set.
if (databaseURL && serviceAccountKey && !admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        
        const initializedApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: databaseURL,
        });

        app = initializedApp;
        database = admin.database();
        auth = admin.auth();
        storage = admin.storage();

    } catch (e: any) {
        console.error("Firebase Admin SDK initialization failed. This is expected during local development if keys are not set. For production, ensure FIREBASE_SERVICE_ACCOUNT_KEY is a valid JSON string and NEXT_PUBLIC_FIREBASE_DATABASE_URL is set in your hosting environment.", e);
    }
} else if (admin.apps.length > 0) {
    // If already initialized, get the existing instance
    app = admin.app();
    database = admin.database();
    auth = admin.auth();
    storage = admin.storage();
} else {
    // This warning helps developers who haven't set up their server-side keys.
    console.warn("Firebase Admin SDK not initialized. Server-side Firebase features will be disabled. Ensure FIREBASE_SERVICE_ACCOUNT_KEY and NEXT_PUBLIC_FIREBASE_DATABASE_URL are set in your environment for full functionality.");
}

export { app, database, auth, storage };
