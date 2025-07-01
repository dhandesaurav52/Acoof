
'use server';

import { generateOutfitSuggestions } from '@/ai/flows/generate-outfit-suggestions';
import { database } from '@/lib/firebase';
import { ref as dbRef, set, push, get } from "firebase/database";
import type { Product } from '@/types';
import { products as staticProducts } from '@/lib/data';
import Razorpay from 'razorpay';
import { randomBytes } from 'crypto';

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
      // Use set on the parent ref to write all products at once
      await set(productsRef, productsToSeed);
    } else if (staticProducts.length > 0) {
        // This case handles if all push() calls failed, which is highly unlikely
        return { error: 'Failed to generate IDs for seeding.' };
    }


    return { success: `Successfully seeded ${staticProducts.length} products.` };
  } catch (error: any) {
    console.error('Database seeding failed:', error);
    let errorMessage = 'An unknown error occurred during database seeding.';
    if (error.code === 'database/permission-denied') {
      errorMessage = "Permission denied. Please check your Firebase Realtime Database security rules.";
    }
    return { error: errorMessage };
  }
}

export async function createRazorpayOrder(amount: number) {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        console.error("Razorpay key ID or secret is not defined in environment variables.");
        return { success: false, error: 'Payment gateway is not configured. Please contact support.' };
    }

    const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });

    const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
        currency: 'INR',
        receipt: `receipt_order_${randomBytes(4).toString('hex')}`,
    };

    try {
        const order = await razorpay.orders.create(options);
        return { success: true, order };
    } catch (error) {
        console.error('Razorpay order creation failed:', error);
        return { success: false, error: 'Failed to create Razorpay order.' };
    }
}
