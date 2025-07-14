
'use server';

import Razorpay from 'razorpay';
import { randomBytes, createHmac } from 'crypto';
import type { Order, Product } from '@/types';
import { database } from '@/lib/firebase';
import { ref as dbRef, update, push, set } from "firebase/database";
import { products as localProducts } from '@/lib/data';

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

export async function saveOrderToDatabase(orderData: Omit<Order, 'id'>): Promise<{ success: boolean; error?: string; orderId?: string; }> {
    if (!database) {
        return { success: false, error: 'Firebase is not configured. Cannot save order.' };
    }

    if (!orderData.userId) {
        return { success: false, error: 'Cannot save order without a user ID.' };
    }

    const newOrderRef = push(dbRef(database, 'orders'));
    const newId = newOrderRef.key;

    if (!newId) {
        return { success: false, error: 'Failed to generate a unique order ID from Firebase.' };
    }
    
    const finalOrderData: Order = { ...orderData, id: newId };
    
    try {
        const updates: { [key: string]: any } = {};
        updates[`/orders/${newId}`] = finalOrderData;
        updates[`/users/${orderData.userId}/orders/${newId}`] = true;

        const notificationMessage = `New order #${newId.slice(-6).toUpperCase()} placed by ${orderData.userEmail}. Total: ₹${orderData.total.toFixed(2)}`;
        const newNotificationRef = push(dbRef(database, 'notifications'));
        const notificationId = newNotificationRef.key;

        if (notificationId) {
            updates[`/notifications/${notificationId}`] = {
                type: 'new_order',
                message: notificationMessage,
                timestamp: new Date().toISOString(),
                read: false,
                orderId: newId,
                userId: orderData.userId,
                userEmail: orderData.userEmail,
            };
        }

        await update(dbRef(database), updates);
        return { success: true, orderId: newId };
    } catch (error: any) {
        let errorMessage = 'An unexpected error occurred while saving the order.';
        if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
            errorMessage = "Permission Denied: Could not save the order. Please check your Firebase Realtime Database security rules to ensure they allow authenticated users to write to the 'orders', their own 'users' data path, and the 'notifications' path simultaneously.";
        }
        console.error("Firebase saveOrder error:", error);
        return { success: false, error: errorMessage };
    }
}

export async function seedProductsToDatabase(): Promise<{ success: boolean; error?: string; count?: number }> {
    if (!database) {
        return { success: false, error: 'Firebase is not configured. Cannot seed products.' };
    }

    const productsRef = dbRef(database, 'products');

    try {
        const productsForFirebase = localProducts.reduce((acc, product) => {
            const { id, ...productData } = product;
            acc[id] = productData;
            return acc;
        }, {} as Record<string, Omit<Product, 'id'>>);
        
        await set(productsRef, productsForFirebase);

        return { success: true, count: localProducts.length };

    } catch (error: any) {
        let errorMessage = 'An unexpected error occurred while seeding the products.';
        if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
            errorMessage = "Permission Denied: Please check your Firebase Realtime Database security rules to allow the admin to write to the 'products' path.";
        }
        console.error("Firebase seedProducts error:", error);
        return { success: false, error: errorMessage };
    }
}
