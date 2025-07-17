
import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;

interface FirebaseAdminInstances {
    app: admin.app.App | null;
    database: admin.database.Database | null;
    auth: admin.auth.Auth | null;
    storage: admin.storage.Storage | null;
}

export function getFirebaseAdmin(): FirebaseAdminInstances {
    if (app) {
        return {
            app,
            database: admin.database(),
            auth: admin.auth(),
            storage: admin.storage(),
        };
    }

    const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
    const serviceAccountKeyString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (databaseURL && serviceAccountKeyString) {
        try {
            // The service account key is passed as a string with literal newlines.
            // JSON.parse cannot handle literal newlines, so they must be escaped.
            const sanitizedKey = serviceAccountKeyString.replace(/\n/g, '\\n');
            const serviceAccount = JSON.parse(sanitizedKey);
            
            app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: databaseURL,
            });

            return {
                app,
                database: admin.database(),
                auth: admin.auth(),
                storage: admin.storage(),
            };

        } catch (e: any) {
            // This handles the case where the app is already initialized, which can happen in development.
            if (!/already exists/u.test(e.message)) {
                console.error('Firebase Admin SDK initialization error:', e);
            }
            if (admin.apps.length) {
                app = admin.app();
                return {
                    app,
                    database: admin.database(),
                    auth: admin.auth(),
                    storage: admin.storage(),
                };
            }
        }
    }
    
    // Return null instances if initialization fails
    console.warn("Firebase Admin SDK could not be initialized. Server-side actions like saving orders will fail. Ensure FIREBASE_SERVICE_ACCOUNT_KEY and NEXT_PUBLIC_FIREBASE_DATABASE_URL are set.");
    return { app: null, database: null, auth: null, storage: null };
}
