
import * as admin from 'firebase-admin';

let app: admin.app.App;

const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

if (!admin.apps.length) {
    try {
        // When running on App Hosting, the config is often automatically available,
        // but we explicitly provide the databaseURL to be safe.
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (serviceAccountKey) {
            const serviceAccount = JSON.parse(serviceAccountKey);
            app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: databaseURL,
            });
        } else {
            // This path is for environments like App Hosting where GOOGLE_APPLICATION_CREDENTIALS is set
            app = admin.initializeApp({
                databaseURL: databaseURL,
            });
        }
    } catch (e: any) {
        console.error("Firebase Admin initialization failed.", e);
        throw new Error("Firebase Admin SDK initialization failed. Check server logs for details.");
    }
} else {
    app = admin.app();
}

const database = app.database();
const auth = app.auth();
const storage = app.storage();

export { app, database, auth, storage };
