'use server';

import Razorpay from 'razorpay';
import { randomBytes, createHmac } from 'crypto';
import type { Order, Product, Notification, OrderStatus } from '@/types';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { products as localProducts } from '@/lib/data';

// This function now uses the Admin SDK directly to verify the token and get the UID.
// It is the standard and most secure way to handle authentication in server actions.
async function getVerifiedUid(idToken: string): Promise<string> {
    const { auth: adminAuth } = getFirebaseAdmin();
    if (!adminAuth) {
        // This is a server configuration issue.
        throw new Error("The authentication service is not configured on the server. This is not a user session issue. Please check server logs.");
    }
    if (!idToken) {
        throw new Error('Authentication token is required.');
    }
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying ID token:", error);
        throw new Error('Your session is invalid or has expired. Please log in again.');
    }
}


export async function createRazorpayOrder(amount: number, idToken: string, receiptId?: string): Promise<{ id: string; amount: number; currency: string; } | { error: string }> {
    try {
        // Explicitly get the admin app instance at the start of the function call.
        getFirebaseAdmin();
        await getVerifiedUid(idToken);
    } catch (e: any) {
        return { error: e.message };
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        const errorMessage = "Payment gateway is not configured on the server. One or more Razorpay API keys are missing. Please check that `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are both set.";
        console.error(`RAZORPAY_ERROR: ${errorMessage}`);
        return { error: errorMessage };
    }

    const amountInPaise = Math.round(amount * 100);
    if (amountInPaise < 100) {
        return { error: 'The total amount must be at least ₹1.00 to proceed with payment.' };
    }

    try {
        const razorpay = new Razorpay({
            key_id: keyId.trim(),
            key_secret: keySecret.trim(),
        });

        const receipt = receiptId || `receipt_${randomBytes(6).toString('hex')}`;
        
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt,
        };
        
        const order = await razorpay.orders.create(options);

        if (!order || !order.id || typeof order.amount !== 'number') {
            throw new Error("Razorpay response was incomplete.");
        }

        return {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
        };
    } catch (error: any) {
        console.error('\n\n--- RAZORPAY ORDER CREATION FAILED ---');
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        console.error('--- END OF RAZORPAY ERROR ---\n\n');

        if (error.statusCode === 401) {
            return { error: "Authentication with Razorpay failed (Error 401). This is the most common payment error. It means your API Keys are incorrect. Please double-check the following: 1) Are there any typos or extra spaces in your keys in the .env file? 2) Are you using your 'Test Mode' keys in your code while your Razorpay account is in 'Live Mode' (or vice-versa)? The modes must match." };
        }
        
        const description = error.error?.description || 'An unknown error occurred.';
        return { error: `Failed to create payment order. Gateway response: ${description}` };
    }
}

export async function verifyRazorpayPayment(data: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<{ success: boolean; error?: string }> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
      console.error("Razorpay secret key not found. Payment verification is not configured on the server.");
      return { success: false, error: 'Payment verification is not configured on the server. The secret key is missing.' };
  }
  
  const { orderId, paymentId, signature } = data;
  const body = orderId + "|" + paymentId;
  
  const expectedSignature = createHmac('sha256', keySecret.trim())
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === signature) {
    return { success: true };
  }
  
  return { success: false, error: "Payment verification failed. This means the response from Razorpay could not be trusted. This is often caused by an incorrect 'RAZORPAY_KEY_SECRET'. Please re-verify your secret key for any typos or extra spaces and ensure it matches your account's mode (Test vs. Live)." };
}

async function createAdminNotification(order: Order): Promise<void> {
    try {
        const { database } = getFirebaseAdmin();
        if (!database || !order.userEmail) return;

        const newNotificationRef = database.ref('notifications').push();
        const notificationId = newNotificationRef.key;

        if (notificationId) {
            const notificationMessage = `New order #${order.id.slice(-6).toUpperCase()} placed by ${order.userEmail}. Total: ₹${order.total.toFixed(2)}`;
            const newNotification: Notification = {
                id: notificationId,
                for_admin: true,
                type: 'new_order',
                message: notificationMessage,
                timestamp: new Date().toISOString(),
                read: false,
                orderId: order.id,
                userId: order.userId,
                userEmail: order.userEmail,
            };
            await newNotificationRef.set(newNotification);
        }
    } catch (error) {
        console.error("Failed to create admin notification:", error);
    }
}

async function createUserNotification(order: Order, newStatus: OrderStatus): Promise<void> {
    try {
        const { database } = getFirebaseAdmin();
        if (!database || !order.userEmail || !order.userId) return;

        const userNotificationsRef = database.ref(`user-notifications/${order.userId}`).push();
        const notificationId = userNotificationsRef.key;

        if (notificationId) {
            const shortId = order.id.slice(-6).toUpperCase();
            let message = '';
            let type: Notification['type'] = 'new_order'; // Default

            if (newStatus === 'Shipped') {
                message = `Your order #${shortId} has been accepted and is now being processed.`;
                type = 'order_accepted';
            } else if (newStatus === 'Cancelled') {
                message = `Your order #${shortId} has been rejected by the seller.`;
                type = 'order_rejected';
            } else {
                return; // Don't send user notifications for other statuses automatically
            }

            const newNotification: Notification = {
                id: notificationId,
                type,
                message,
                timestamp: new Date().toISOString(),
                read: false,
                orderId: order.id,
                userId: order.userId,
                userEmail: order.userEmail,
            };
            await userNotificationsRef.set(newNotification);
        }
    } catch (error) {
        console.error(`Failed to create user notification for order ${order.id}:`, error);
    }
}

export async function updateOrderStatusAndNotify(order: Order, newStatus: OrderStatus, adminIdToken: string): Promise<{ success: boolean, error?: string }> {
    const { auth: adminAuth, database } = getFirebaseAdmin();
    try {
        const adminUid = await getVerifiedUid(adminIdToken);
        const adminUser = await adminAuth!.getUser(adminUid);
        if (adminUser.email !== 'admin@example.com') {
            return { success: false, error: "Unauthorized: Only admins can perform this action." };
        }
    } catch(e: any) {
        return { success: false, error: e.message };
    }

    if (!database) {
        return { success: false, error: "Database not configured" };
    }

    const orderRef = database.ref(`orders/${order.id}`);
    try {
        await orderRef.update({ status: newStatus });
        await createUserNotification(order, newStatus);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update order status:", error);
        return { success: false, error: "Could not update order status in the database." };
    }
}


export async function saveOrderToDatabase(orderData: Omit<Order, 'id'>, idToken: string): Promise<{ success: boolean; error?: string; orderId?: string; }> {
    try {
        const { database, auth } = getFirebaseAdmin();
        if (!database || !auth) {
            console.error("DATABASE_SAVE_ERROR: Firebase Admin Database is not initialized.");
            return { success: false, error: 'Firebase is not configured on the server. Cannot save order.' };
        }

        let verifiedUid: string;
        try {
            verifiedUid = await getVerifiedUid(idToken);
        } catch (e: any) {
            console.error("DATABASE_SAVE_ERROR: Failed to verify user ID token.", e);
            return { success: false, error: e.message };
        }

        if (orderData.userId !== verifiedUid) {
            console.error(`DATABASE_SAVE_ERROR: User ID mismatch. Authenticated UID: ${verifiedUid}, Order UID: ${orderData.userId}`);
            return { success: false, error: 'User ID does not match authenticated user. Cannot save order.' };
        }
        
        const newOrderRef = database.ref('orders').push();
        const newId = newOrderRef.key;

        if (!newId) {
            console.error("DATABASE_SAVE_ERROR: Failed to generate a unique order ID from Firebase.");
            return { success: false, error: 'Failed to generate a unique order ID from Firebase.' };
        }
        
        const finalOrderData: Order = { 
            ...orderData, 
            id: newId, 
            status: 'Pending' 
        };
        
        const updates: { [key: string]: any } = {};
        updates[`/orders/${newId}`] = finalOrderData;
        updates[`/users/${orderData.userId}/orders/${newId}`] = true;

        await database.ref().update(updates);
        
        await createAdminNotification(finalOrderData);

        return { success: true, orderId: newId };

    } catch (error: any) {
        console.error('\n\n--- UNHANDLED ERROR IN saveOrderToDatabase ---');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        console.error('--- END OF saveOrderToDatabase ERROR ---\n\n');

        if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
            return { success: false, error: "Permission Denied: Could not save the order. This is a critical configuration error. Please go to your Google Cloud Project's IAM page and ensure the `firebase-adminsdk` service account has the `Firebase Realtime Database Admin` role. This is the most likely cause of this failure." };
        }
        return { success: false, error: 'A critical error occurred on the server while saving the order. The issue has been logged.' };
    }
}

export async function seedProductsToDatabase(): Promise<{ success: boolean; error?: string; count?: number }> {
    const { database } = getFirebaseAdmin();
    if (!database) {
        return { success: false, error: 'Firebase is not configured. Cannot seed products.' };
    }

    const productsRef = database.ref('products');

    try {
        const productsForFirebase = localProducts.reduce((acc, product) => {
            const { id, ...productData } = product;
            acc[id] = productData;
            return acc;
        }, {} as Record<string, Omit<Product, 'id'>>);
        
        await productsRef.set(productsForFirebase);

        return { success: true, count: localProducts.length };

    } catch (error: any) {
        console.error("Firebase seedProducts error:", error);
        return { success: false, error: 'An unexpected error occurred while seeding the products.' };
    }
}
