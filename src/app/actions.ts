
'use server';

import { generateOutfitSuggestions } from '@/ai/flows/generate-outfit-suggestions';
import { database, storage } from '@/lib/firebase';
import { ref as dbRef, set, push, get, remove } from "firebase/database";
import { ref as storageRef, deleteObject } from 'firebase/storage';
import type { Product } from '@/types';
import { products as staticProducts } from '@/lib/data';

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

export async function deleteProduct(productId: string, imageUrls: string[]): Promise<{ success?: string; error?: string; }> {
  if (!database || !storage) {
    return { error: 'Firebase is not configured. Cannot delete product.' };
  }

  try {
    // 1. Delete product data from Realtime Database first.
    // If this fails due to permissions, we won't try to delete images.
    const productRef = dbRef(database, `products/${productId}`);
    await remove(productRef);

    // 2. Delete associated images from Firebase Storage.
    // We won't block the success message if image deletion fails, but we'll log it.
    const imageDeletionPromises = imageUrls
      .filter(url => url && !url.includes('placehold.co') && url.includes('firebasestorage.googleapis.com'))
      .map(url => {
        try {
          const imageRef = storageRef(storage, url);
          return deleteObject(imageRef);
        } catch (e) {
          console.error(`Error creating storage reference for ${url}. Skipping deletion.`, e);
          return Promise.resolve(); // Don't block other deletions
        }
      });

    const results = await Promise.allSettled(imageDeletionPromises);
    const failedDeletions = results.filter(r => r.status === 'rejected');
    if (failedDeletions.length > 0) {
      console.error('Some product images failed to delete:', failedDeletions);
      // We can still return a success message for the product data deletion, with a warning.
      return { success: `Product data deleted, but ${failedDeletions.length} image(s) could not be removed. Please check Storage rules and delete them manually.` };
    }

    return { success: 'Product and associated images successfully deleted.' };
  } catch (error: any) {
    console.error('Product deletion failed:', error);
    let errorMessage = 'An unknown error occurred during product deletion.';
    
    if (error.code === 'database/permission-denied') {
      errorMessage = "Database permission denied. Please ensure you are logged in as admin and that your Realtime Database rules allow writes for 'admin@example.com'.";
    } else if (error.code === 'storage/unauthorized') {
      // This error would likely be caught by allSettled, but it's here as a fallback.
      errorMessage = "Storage permission denied during image cleanup. Please check your Firebase Storage security rules.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { error: errorMessage };
  }
}
