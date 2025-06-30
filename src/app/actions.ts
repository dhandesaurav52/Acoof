
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

  // --- Step 1: Attempt to delete associated images from Firebase Storage ---
  // The Firebase SDK can create a reference directly from a gs:// or https:// URL.
  // This is more robust than manual parsing.
  const imageDeletionPromises = imageUrls
    .filter(url => url && url.includes('firebasestorage.googleapis.com'))
    .map(url => {
      try {
        const imageRef = storageRef(storage, url);
        return deleteObject(imageRef).catch(err => {
            // It's not a critical error if the image doesn't exist, it may have been cleaned up already.
            if (err.code === 'storage/object-not-found') {
                console.warn(`Image not found, skipping deletion: ${url}`);
                return null; // Resolve successfully
            }
            // For other errors, re-throw to be caught by Promise.allSettled
            throw err;
        });
      } catch (e) {
        console.error(`Invalid storage URL, skipping deletion: ${url}`, e);
        return null; // Skip invalid URLs
      }
    });
  
  const validPromises = imageDeletionPromises.filter((p): p is Promise<void> => p !== null);

  if (validPromises.length > 0) {
      const results = await Promise.allSettled(validPromises);
      const failedDeletions = results.filter(result => result.status === 'rejected');

      if (failedDeletions.length > 0) {
          failedDeletions.forEach(failure => {
              if ('reason' in failure) {
                console.error('An image failed to delete:', (failure as PromiseRejectedResult).reason);
              }
          });
        
          const firstError = (failedDeletions[0] as PromiseRejectedResult).reason;
          
          if (firstError?.code === 'storage/unauthorized') {
              const errorMessage = "Storage permission was denied for image removal. Please check your Firebase Storage security rules.";
              return { error: errorMessage };
          }
           return { error: "Failed to remove one or more images." };
      }
  }

  // --- Step 2: Attempt to delete product from Realtime Database ---
  try {
    const productRef = dbRef(database, `products/${productId}`);
    await remove(productRef);
  } catch (error: any) {
    console.error('Database deletion failed:', error);
    if (error.code === 'PERMISSION_DENIED' || error.message.includes('permission_denied')) {
      return { error: "Images deleted, but database permission was denied for product data. Please check your Realtime Database security rules." };
    }
    return { error: `Images deleted, but an unexpected error occurred while deleting product data: ${error.message}` };
  }

  return { success: 'Product and associated images were successfully deleted.' };
}
