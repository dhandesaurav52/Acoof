
import * as admin from 'firebase-admin';

let app: admin.app.App;

if (!admin.apps.length) {
    try {
        // When running on App Hosting, the config is automatically available
        // in the GOOGLE_APPLICATION_CREDENTIALS environment variable.
        app = admin.initializeApp();
    } catch (e: any) {
        // This is a fallback for local development where you might use a service account file
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
                 app = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
                });
            } catch (parseError) {
                console.error("Failed to parse Firebase service account key. Ensure it's a valid JSON string.", parseError);
                throw new Error("Firebase Admin SDK initialization failed due to invalid credentials.");
            }
        } else {
             console.error("Firebase Admin initialization failed. For local development, set FIREBASE_SERVICE_ACCOUNT_KEY and NEXT_PUBLIC_FIREBASE_DATABASE_URL in your .env.local file. On App Hosting, ensure the service account is configured.");
             throw new Error("Firebase Admin SDK initialization failed.");
        }
    }
} else {
    app = admin.app();
}

const database = admin.database();
const auth = admin.auth();
const storage = admin.storage();

export { app, database, auth, storage };
