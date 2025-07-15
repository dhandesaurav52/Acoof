
import * as admin from 'firebase-admin';

let app: admin.app.App;

// This URL is crucial for the Admin SDK to connect to the Realtime Database.
const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

if (!admin.apps.length) {
    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        
        // When running on a deployed environment like App Hosting, the config is often auto-populated.
        // However, to prevent errors, we must explicitly provide the databaseURL.
        const config = {
            databaseURL: databaseURL,
        };

        if (serviceAccountKey) {
            // This path is typically for local development where a service account key is provided in .env
            const serviceAccount = JSON.parse(serviceAccountKey);
            app = admin.initializeApp({
                ...config,
                credential: admin.credential.cert(serviceAccount),
            });
        } else {
            // This path is for environments like App Hosting where GOOGLE_APPLICATION_CREDENTIALS are set.
            // The credential is found automatically, but we still need to provide the databaseURL.
            app = admin.initializeApp(config);
        }
    } catch (e: any) {
        console.error("Firebase Admin initialization failed.", e);
        // Provide a more helpful error message for developers.
        if (!databaseURL) {
            throw new Error("Firebase Admin SDK initialization failed: NEXT_PUBLIC_FIREBASE_DATABASE_URL environment variable is not set.");
        }
        throw new Error("Firebase Admin SDK initialization failed. Check server logs for details.");
    }
} else {
    app = admin.app();
}

const database = app.database();
const auth = app.auth();
const storage = app.storage();

export { app, database, auth, storage };
