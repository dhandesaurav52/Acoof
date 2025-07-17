
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
    // This is the corrected line. It now looks for the same secret name as the deployment workflow.
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (databaseURL && serviceAccountKey) {
        try {
            const serviceAccount = JSON.parse(serviceAccountKey);
            
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
    return { app: null, database: null, auth: null, storage: null };
}
