
import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { headers } from 'next/headers';

const ADMIN_EMAIL = "admin@example.com";

export async function GET() {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    // Detailed logging for debugging
    console.log("API Route: Received headers:", Object.fromEntries(headersList.entries()));
    console.log("API Route: Authorization header:", authorization);

    if (!authorization || !authorization.startsWith('Bearer ')) {
        console.error("API Route Error: Authorization header missing or invalid format.");
        return NextResponse.json({ error: 'Authorization header missing or invalid.' }, { status: 401 });
    }
    const token = authorization.split('Bearer ')[1];
    console.log("API Route: Extracted token:", token ? "Token present" : "Token NOT present");

    if (!token) {
        console.error("API Route Error: Token is empty after splitting from header.");
        return NextResponse.json({ error: 'Authorization token is empty.' }, { status: 401 });
    }

    if (!admin.apps.length) {
        console.error("API Route Error: Firebase Admin SDK not initialized.");
        return NextResponse.json({ error: 'Firebase Admin SDK not initialized.' }, { status: 500 });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        if (decodedToken.email !== ADMIN_EMAIL) {
            console.warn(`API Route Warning: Unauthorized access attempt by ${decodedToken.email}`);
            return NextResponse.json({ error: 'Unauthorized. Not an admin user.' }, { status: 403 });
        }

        const db = admin.database();
        const usersRef = db.ref('users');
        const ordersRef = db.ref('orders');

        const [usersSnapshot, ordersSnapshot] = await Promise.all([
            usersRef.once('value'),
            ordersRef.once('value')
        ]);

        let usersCount = 0;
        if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val();
            const totalUsers = usersSnapshot.numChildren();
            
            const hasAdmin = Object.values(usersData).some((user: any) => user.email === ADMIN_EMAIL);
            
            usersCount = hasAdmin ? totalUsers - 1 : totalUsers;
        }
        
        let totalRevenue = 0;
        let salesCount = 0;
        if (ordersSnapshot.exists()) {
            const ordersData = ordersSnapshot.val();
            salesCount = Object.keys(ordersData).length;
            totalRevenue = Object.values(ordersData).reduce((acc: number, order: any) => acc + (order.total || 0), 0);
        }

        const data = {
            totalRevenue,
            salesCount,
            usersCount,
        };
        
        return NextResponse.json(data);

    } catch (error: any) {
        // Log the full error from Firebase for detailed debugging
        console.error("API Route Error: Firebase token verification failed.", {
            errorCode: error.code,
            errorMessage: error.message,
        });

        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Authentication token has expired. Please log in again.' }, { status: 401 });
        }
        if (error.code === 'auth/argument-error') {
            return NextResponse.json({ error: 'Invalid auth token format. The token sent from the browser was malformed.' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Invalid auth token. Please check server logs for more details.' }, { status: 401 });
    }
}
