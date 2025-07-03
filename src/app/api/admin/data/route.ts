
import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { headers } from 'next/headers';

const ADMIN_EMAIL = "admin@example.com";

export async function GET() {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Authorization header missing or invalid.' }, { status: 401 });
    }
    const token = authorization.split('Bearer ')[1];

    if (!admin.apps.length) {
        return NextResponse.json({ error: 'Firebase Admin SDK not initialized.' }, { status: 500 });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        if (decodedToken.email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized. Not an admin user.' }, { status: 403 });
        }

        const db = admin.database();
        const usersRef = db.ref('users');
        const ordersRef = db.ref('orders');

        const [usersSnapshot, ordersSnapshot] = await Promise.all([
            usersRef.once('value'),
            ordersRef.once('value')
        ]);

        const usersCount = usersSnapshot.exists() ? usersSnapshot.numChildren() : 0;
        
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
        console.error("API Error verifying token. Token received:", token, "Full Error:", error);
        let message = 'Invalid auth token.';
        if (error.code === 'auth/id-token-expired') {
            message = 'Auth token has expired. Please log in again.';
        } else if (error.code === 'auth/argument-error') {
            message = 'Invalid auth token format.';
        }
        return NextResponse.json({ error: message, detail: error.message }, { status: 401 });
    }
}
