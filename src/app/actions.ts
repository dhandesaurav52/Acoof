
'use server';

import Razorpay from 'razorpay';
import { randomBytes, createHmac } from 'crypto';
import type { Order, Product, Notification } from '@/types';
import { database } from '@/lib/firebase-admin'; // Use Admin SDK for server actions
import { auth as adminAuth } from 'firebase-admin';
import { products as localProducts } from '@/lib/data';

// Helper to verify user token. This is crucial for securing server actions.
async function getVerifiedUid(authHeader?: string): Promise<string> {
    if (!authHeader) {
        throw new Error('No authorization header provided.');
    }
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
        throw new Error('Invalid authorization header format.');
    }
    try {
        const decodedToken = await adminAuth().verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying ID token:", error);
        throw new Error('Invalid or expired user session.');
    }
}


export async function createRazorpayOrder(amount: number, receiptId?: string): Promise<{ id: string; amount: number; currency: string; } | { error: string }> {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        const errorMessage = "Payment gateway is not configured on the server. One or more Razorpay API keys are missing from the .env file. Please check that `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are both set.";
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
      console.error("Razorpay secret key not found in .env file");
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
    if (!database || !order.userEmail) return;
    try {
        const newNotificationRef = database.ref('notifications').push();
        const notificationId = newNotificationRef.key;

        if (notificationId) {
            const notificationMessage = `New order #${order.id.slice(-6).toUpperCase()} placed by ${order.userEmail}. Total: ₹${order.total.toFixed(2)}`;
            const newNotification: Notification = {
                id: notificationId,
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

export async function saveOrderToDatabase(orderData: Omit<Order, 'id'>): Promise<{ success: boolean; error?: string; orderId?: string; }> {
    if (!database) {
        return { success: false, error: 'Firebase is not configured. Cannot save order.' };
    }

    if (!orderData.userId) {
        return { success: false, error: 'Cannot save order without a user ID.' };
    }
    
    const newOrderRef = database.ref('orders').push();
    const newId = newOrderRef.key;

    if (!newId) {
        return { success: false, error: 'Failed to generate a unique order ID from Firebase.' };
    }
    
    const finalOrderData: Order = { ...orderData, id: newId };
    
    try {
        const updates: { [key: string]: any } = {};
        updates[`/orders/${newId}`] = finalOrderData;
        updates[`/users/${orderData.userId}/orders/${newId}`] = true;

        await database.ref().update(updates);
        
        await createAdminNotification(finalOrderData);

        return { success: true, orderId: newId };

    } catch (error: any) {
        console.error("Firebase saveOrder error:", error);
        return { success: false, error: 'An unexpected error occurred while saving the order. Check server logs.' };
    }
}

export async function seedProductsToDatabase(): Promise<{ success: boolean; error?: string; count?: number }> {
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
