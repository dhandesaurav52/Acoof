
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
    // Step 1: Delete product data from Realtime Database.
    const productRef = dbRef(database, `products/${productId}`);
    await remove(productRef);

    // Step 2: Delete associated images from Firebase Storage.
    const imageDeletionPromises = imageUrls
      .filter(url => url && url.includes('firebasestorage.googleapis.com'))
      .map(url => {
        try {
          // Manually parse the file path from the full HTTPS URL to be more robust.
          const imagePath = new URL(url).pathname.split('/o/')[1];
          const decodedPath = decodeURIComponent(imagePath);
          const imageRef = storageRef(storage, decodedPath);
          return deleteObject(imageRef);
        } catch (e) {
          console.error(`Failed to parse URL or create storage ref for: ${url}`, e);
          // Return a resolved promise to not break Promise.all for other valid URLs
          return Promise.resolve(); 
        }
      });

    if (imageDeletionPromises.length > 0) {
      await Promise.all(imageDeletionPromises);
    }

    return { success: 'Product and associated images were successfully deleted.' };
  } catch (error: any) {
    console.error('Product deletion failed:', error);
    
    let errorMessage = 'An unknown error occurred during product deletion.';
    
    if (error.code === 'database/permission-denied') {
      errorMessage = "Database permission denied. Please check your Realtime Database rules.";
    } else if (error.code === 'storage/unauthorized') {
      errorMessage = "Storage permission denied. The product data may have been deleted, but its images could not be removed. Please check your Firebase Storage security rules.";
    } else if (error.code === 'storage/object-not-found') {
        errorMessage = "Storage object not found. The product data was deleted, but an image was not found at the specified URL. It might have been deleted already.";
    } else {
      errorMessage = error.message || errorMessage;
    }
    
    return { error: errorMessage };
  }
}
