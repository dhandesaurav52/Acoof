
import * as admin from 'firebase-admin';

// This is a more robust way to handle initialization in serverless environments.
// We store the initialized app in a global variable to prevent re-initialization on hot reloads.
let app: admin.app.App | null = null;

interface FirebaseAdminInstances {
    app: admin.app.App | null;
    database: admin.database.Database | null;
    auth: admin.auth.Auth | null;
    storage: admin.storage.Storage | null;
}

export function getFirebaseAdmin(): FirebaseAdminInstances {
    // If the app is already initialized, return the existing instances.
    // This prevents re-initializing the app on every server-side call in development.
    if (admin.apps.length > 0 && admin.app()) {
        app = admin.app();
        return {
            app,
            database: admin.database(),
            auth: admin.auth(),
            storage: admin.storage(),
        };
    }

    try {
        // In a deployed Google Cloud environment (like Firebase Hosting for Next.js),
        // we explicitly provide the databaseURL to ensure the SDK connects to the
        // correct regional database. This is a common fix for server-side issues.
        app = admin.initializeApp({
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });

        return {
            app,
            database: admin.database(),
            auth: admin.auth(),
            storage: admin.storage(),
        };

    } catch (e: any) {
        console.error('Firebase Admin SDK initialization error:', e);
    }
    
    // Return null instances if initialization fails for any reason.
    console.error("Firebase Admin SDK could not be initialized. Server-side actions will fail.");
    return { app: null, database: null, auth: null, storage: null };
}
