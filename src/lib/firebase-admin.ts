
import * as admin from 'firebase-admin';

let app: admin.app.App;

const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!admin.apps.length) {
    if (!databaseURL || !serviceAccountKey) {
        let missingVars = [];
        if (!databaseURL) missingVars.push('NEXT_PUBLIC_FIREBASE_DATABASE_URL');
        if (!serviceAccountKey) missingVars.push('FIREBASE_SERVICE_ACCOUNT_KEY');
        // This clear error is crucial for debugging in production environments.
        throw new Error(`Firebase Admin SDK initialization failed: The following required environment variables are missing: ${missingVars.join(', ')}. Please ensure they are set in your hosting environment.`);
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        
        app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: databaseURL,
        });

    } catch (e: any) {
        console.error("Firebase Admin initialization failed with an error.", e);
        // Provide a more specific error for common issues.
        if (e.message.includes('json')) {
            throw new Error("Firebase Admin SDK initialization failed: The value of FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Please ensure you have copied the entire contents of your service account key file correctly.");
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
