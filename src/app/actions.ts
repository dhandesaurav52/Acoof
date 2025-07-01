
'use server';

import { generateOutfitSuggestions } from '@/ai/flows/generate-outfit-suggestions';
import { database, storage } from '@/lib/firebase';
import { ref as dbRef, set, push, get, remove, query, orderByChild, equalTo, update } from "firebase/database";
import { ref as storageRef, deleteObject } from 'firebase/storage';
import type { Product, Order, OrderStatus } from '@/types';
import { products as staticProducts } from '@/lib/data';
import Razorpay from 'razorpay';
import { randomBytes, createHmac } from 'crypto';

export async function getAiSuggestions(browsingHistory: string) {
  try {
    const result = await generateOutfitSuggestions({ browsingHistory });
    if (!result || !result.suggestions) {
      return { suggestions: [], error: 'Received an invalid response from the AI.' };
    }
    return { suggestions: result.suggestions, error: null };
  } catch (error) {
    console.error('AI suggestion generation failed:', error);
    return { suggestions: [], error: 'Failed to generate suggestions. Please try again later.' };
  }
}

export async function seedDatabase(): Promise<{ success?: string; error?: string; }> {
  if (!database) {
    return { error: 'Firebase is not configured. Cannot seed database.' };
  }

  const productsRef = dbRef(database, 'products');
  
  try {
    const snapshot = await get(productsRef);
    if (snapshot.exists()) {
      return { error: 'Database already contains products. Seeding aborted.' };
    }

    const productsToSeed: { [key: string]: Product } = {};
    staticProducts.forEach(product => {
      const newProductRef = push(productsRef);
      const newId = newProductRef.key;
      if (newId) {
        productsToSeed[newId] = { ...product, id: newId };
      }
    });
    
    if(Object.keys(productsToSeed).length > 0) {
      await set(productsRef, productsToSeed);
    } else if (staticProducts.length > 0) {
        return { error: 'Failed to generate IDs for seeding.' };
    }


    return { success: `Successfully seeded ${staticProducts.length} products.` };
  } catch (error: any) {
    console.error('Database seeding failed:', error);
    let errorMessage = 'An unknown error occurred during database seeding.';
    if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
      errorMessage = "Permission denied. Please check your Firebase Realtime Database security rules.";
    }
    return { error: errorMessage };
  }
}

export async function createRazorpayOrder(amount: number, receiptId?: string): Promise<{ id: string; amount: number; currency: string; } | { error: string }> {
    console.log('--- Attempting to create Razorpay Order on the server ---');
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        const errorMessage = "Payment gateway is not configured on the server. One or more Razorpay API keys are missing from the .env file. Please check that `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are both set.";
        console.error('createRazorpayOrder Error:', errorMessage);
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
        
        console.log('Razorpay Order Options:', options);
        const order = await razorpay.orders.create(options);
        console.log('--- Razorpay Order Created Successfully ---');
        return {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
        };
    } catch (error: any) {
        // This is the most important log. It will show the exact error from Razorpay.
        console.error('\n\n--- RAZORPAY ORDER CREATION FAILED ---');
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        console.error('--- END OF RAZORPAY ERROR ---\n\n');

        if (error.statusCode === 401) {
            return { error: "Authentication with Razorpay failed. This is almost always due to an incorrect 'RAZORPAY_KEY_ID' or 'RAZORPAY_KEY_SECRET'. Please meticulously check them for typos, extra spaces, and ensure you are using the correct keys for your account's mode (Test vs. Live)." };
        }
        return { error: `Failed to create payment order. The payment gateway responded with: ${error.error?.description || 'An unknown error'}` };
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

export async function saveOrder(orderData: Omit<Order, 'id'>): Promise<{ success: boolean; error?: string; orderId?: string; }> {
    if (!database) {
        return { success: false, error: 'Firebase is not configured. Cannot save order.' };
    }

    const ordersRef = dbRef(database, 'orders');
    const newOrderRef = push(ordersRef);
    const newId = newOrderRef.key;

    if (!newId) {
        return { success: false, error: 'Failed to generate a new order ID from Firebase.' };
    }
    
    const orderWithId: Order = { ...orderData, id: newId };

    try {
        await set(newOrderRef, orderWithId);
        return { success: true, orderId: newId };
    } catch (error: any) {
        console.error('Failed to save order:', error);
        if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
            return { success: false, error: "Permission denied. Please check your Firebase Realtime Database security rules to allow users to create orders." };
        }
        return { success: false, error: 'An error occurred while saving the order.' };
    }
}

export async function deleteProduct(productId: string, imageUrls: string[]): Promise<{ success?: string; error?: string; }> {
  if (!database || !storage) {
    return { error: 'Firebase is not configured. Cannot delete product.' };
  }

  try {
    const productRef = dbRef(database, `products/${productId}`);
    await remove(productRef);
  } catch (error: any) {
    console.error('Database deletion failed:', error);
    if (error.code === 'PERMISSION_DENIED' || error.message.includes('permission_denied')) {
      return { error: "Database permission denied. Please check your Realtime Database security rules." };
    }
    return { error: `An unexpected error occurred while deleting product data: ${error.message}` };
  }

  const imageDeletionPromises = imageUrls
    .filter(url => url && url.includes('firebasestorage.googleapis.com'))
    .map(url => {
      try {
        const imageRef = storageRef(storage, url);
        return deleteObject(imageRef).catch(err => {
            if (err.code === 'storage/object-not-found') {
                console.warn(`Image not found, skipping deletion: ${url}`);
                return null;
            }
            console.error(`Failed to delete image ${url}:`, err);
            throw err;
        });
      } catch (e) {
        console.error(`Invalid storage URL, skipping deletion: ${url}`, e);
        return null;
      }
    });
  
  const validPromises = imageDeletionPromises.filter((p): p is Promise<void> => p !== null);

  if (validPromises.length > 0) {
      const results = await Promise.allSettled(validPromises);
      const failedDeletions = results.filter(result => result.status === 'rejected');

      if (failedDeletions.length > 0) {
          const firstError = (failedDeletions[0] as PromiseRejectedResult).reason;
          let errorMessage = "Product data was deleted, but failed to remove one or more images.";
          if (firstError?.code === 'storage/unauthorized') {
              errorMessage = "Product data was deleted, but Storage permission was denied for image removal. Check your Storage rules.";
          }
          return { success: 'Product was successfully deleted, but some images may remain.', error: errorMessage };
      }
  }

  return { success: 'Product and its images were successfully deleted.' };
}

export async function getOrders(): Promise<{ orders?: Order[]; error?: string; }> {
    if (!database) {
        return { error: 'Firebase is not configured. Cannot fetch orders.' };
    }
    const ordersRef = dbRef(database, 'orders');
    try {
        const snapshot = await get(ordersRef);
        if (snapshot.exists()) {
            const ordersData = snapshot.val();
            const ordersList: Order[] = Object.keys(ordersData)
                .map(key => ({ id: key, ...ordersData[key] }))
                .reverse();
            return { orders: ordersList };
        }
        return { orders: [] };
    } catch (error: any) {
        console.error('Failed to fetch orders:', error);
        if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
            return { error: "Permission denied. Please check your Firebase Realtime Database security rules to allow admins to read all orders." };
        }
        return { error: 'An error occurred while fetching orders.' };
    }
}

export async function getUserOrders(userEmail: string): Promise<{ orders?: Order[]; error?: string; }> {
    if (!database) {
        return { error: 'Firebase is not configured. Cannot fetch orders.' };
    }
    const ordersRef = dbRef(database, 'orders');
    const userOrdersQuery = query(ordersRef, orderByChild('userEmail'), equalTo(userEmail));
    
    try {
        const snapshot = await get(userOrdersQuery);
        if (snapshot.exists()) {
            const ordersData = snapshot.val();
            const ordersList: Order[] = Object.keys(ordersData)
                .map(key => ({ id: key, ...ordersData[key] }))
                .reverse();
            return { orders: ordersList };
        }
        return { orders: [] };
    } catch (error: any) {
        console.error('Failed to fetch user orders:', error);
        if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
            return { error: "Permission denied. Please check your Firebase Realtime Database security rules to allow users to read their own orders." };
        }
        return { error: 'An error occurred while fetching your orders.' };
    }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<{ success?: boolean; error?: string; }> {
    if (!database) {
        return { error: 'Firebase is not configured. Cannot update order.' };
    }
    const orderRef = dbRef(database, `orders/${orderId}`);
    try {
        await update(orderRef, { status });
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update order status:', error);
        if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
            return { error: "Permission denied. Please check your Firebase Realtime Database security rules to allow admins to update orders." };
        }
        return { error: 'An error occurred while updating the order status.' };
    }
}
