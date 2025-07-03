
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import admin from '@/lib/firebase-admin';
import type { Order } from '@/types';

const ADMIN_EMAIL = "admin@example.com";

export async function GET() {
    const headersList = headers();
    const authHeader = headersList.get('Authorization');

    if (!authHeader) {
        return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
        return NextResponse.json({ error: 'Bearer token missing' }, { status: 401 });
    }

    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
        return NextResponse.json({ error: 'Invalid auth token', details: (error as Error).message }, { status: 403 });
    }

    if (decodedToken.email !== ADMIN_EMAIL) {
        return NextResponse.json({ error: 'User is not an admin' }, { status: 403 });
    }
    
    try {
        const db = admin.database();
        const usersRef = db.ref('users');
        const ordersRef = db.ref('orders');

        const [usersSnapshot, ordersSnapshot] = await Promise.all([
            usersRef.once('value'),
            ordersRef.once('value'),
        ]);

        const usersData = usersSnapshot.val() || {};
        const ordersData = ordersSnapshot.val() || {};

        const usersCount = Object.keys(usersData).length;
        
        const ordersList: Order[] = Object.keys(ordersData)
            .map(key => ({ id: key, ...ordersData[key] }))
            .reverse();

        return NextResponse.json({
            usersCount,
            orders: ordersList,
        });

    } catch (error: any) {
        console.error("Error fetching admin data:", error);
        return NextResponse.json({ error: 'Failed to fetch data from database' }, { status: 500 });
    }
}
