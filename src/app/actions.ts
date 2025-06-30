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

  // --- Step 1: Attempt to delete product from Realtime Database ---
  try {
    const productRef = dbRef(database, `products/${productId}`);
    await remove(productRef);
  } catch (error: any) {
    console.error('Database deletion failed:', error);
    if (error.code === 'database/permission-denied' || error.code === 'PERMISSION_DENIED') {
      return { error: "Database permission denied. Please check your Realtime Database security rules." };
    }
    return { error: `An unexpected error occurred while deleting product data: ${error.message}` };
  }

  // --- Step 2: Attempt to delete associated images from Firebase Storage ---
  const imageDeletionPromises = imageUrls
    .filter(url => url && url.includes('firebasestorage.googleapis.com'))
    .map(url => {
      try {
        const imagePathWithQuery = new URL(url).pathname.split('/o/')[1];
        if (!imagePathWithQuery) {
            console.warn(`Could not extract path from storage URL: ${url}`);
            return Promise.resolve(); // Skip this invalid URL
        }
        const imagePath = imagePathWithQuery.split('?')[0];
        const decodedPath = decodeURIComponent(imagePath);
        const imageRef = storageRef(storage, decodedPath);
        return deleteObject(imageRef);
      } catch (e) {
        console.error(`Failed to parse URL or create storage ref for: ${url}`, e);
        return Promise.resolve(); // Skip this invalid URL
      }
    });
  
  const validPromises = imageDeletionPromises.filter(Boolean);

  if (validPromises.length > 0) {
      const results = await Promise.allSettled(validPromises);
      const failedDeletions = results.filter(result => result.status === 'rejected');

      if (failedDeletions.length > 0) {
          // Log all failures for debugging and return a summary error.
          failedDeletions.forEach(failure => {
              if ('reason' in failure) {
                console.error('An image failed to delete:', (failure as PromiseRejectedResult).reason);
              }
          });
        
          const firstError = (failedDeletions[0] as PromiseRejectedResult).reason;
          let errorMessage = "Product data deleted, but failed to remove one or more images.";
          if (firstError?.code === 'storage/unauthorized') {
              errorMessage = "Product data deleted, but Storage permission was denied for image removal. Please check your Firebase Storage security rules.";
          }
          // We don't treat "not found" as a hard error, as the image might already be gone.
          else if (firstError?.code === 'storage/object-not-found') {
              return { success: 'Product deleted. Some images were not found in storage and may have been already removed.' };
          }
          return { error: errorMessage };
      }
  }

  return { success: 'Product and associated images were successfully deleted.' };
}
