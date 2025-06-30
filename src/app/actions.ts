
'use server';

import { generateOutfitSuggestions } from '@/ai/flows/generate-outfit-suggestions';
import { database, storage } from '@/lib/firebase';
import { ref as dbRef, set, push, get, child } from "firebase/database";
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
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

export async function addProduct(productData: Omit<Product, 'id'>): Promise<{ success?: string; error?: string; }> {
    if (!database || !storage) {
        return { error: 'Firebase is not configured. Cannot add product.' };
    }
    
    // Stricter validation
    if (!productData.name || !productData.price || !productData.category) {
        return { error: 'Missing required product fields: name, price, or category.' };
    }

    try {
        let imageUrls: string[] = [];
        
        if (productData.images && productData.images.length > 0 && productData.images[0].startsWith('data:')) {
            let uploadErrorOccurred: string | null = null;

            const uploadPromises = productData.images.map(async (imgDataUri, index) => {
                const newIdForImage = push(child(dbRef(database), 'products')).key || `image_${Date.now()}`;
                const fileExtensionMatch = imgDataUri.match(/data:image\/(.+);base64,/);
                const fileExtension = fileExtensionMatch ? fileExtensionMatch[1] : 'png';
                const imageFileName = `${newIdForImage}_${index}.${fileExtension}`;
                const imageStorageRef = storageRef(storage, `products/${imageFileName}`);
                
                try {
                    const snapshot = await uploadString(imageStorageRef, imgDataUri, 'data_url');
                    return getDownloadURL(snapshot.ref);
                } catch (uploadError: any) {
                    console.error(`Failed to upload image ${index}:`, uploadError);
                    if (uploadError.code === 'storage/unauthorized') {
                        uploadErrorOccurred = "Permission denied for Firebase Storage. Please check your Storage security rules to allow writes to the 'products' path for authenticated users.";
                    } else {
                        uploadErrorOccurred = `An error occurred during image upload: ${uploadError.message}`;
                    }
                    return null; // Return null on failure to prevent Promise.all from rejecting immediately
                }
            });

            const settledImageUrls = await Promise.all(uploadPromises);

            if (uploadErrorOccurred) {
                return { error: uploadErrorOccurred };
            }

            // Filter out any nulls which indicate a failed upload.
            imageUrls = settledImageUrls.filter((url): url is string => url !== null);
            
            if (imageUrls.length !== productData.images.length) {
                return { error: "One or more images failed to upload. Product not added." };
            }

        } else {
            // Use placeholder if no images are provided
            imageUrls = productData.images?.length > 0 ? productData.images : ['https://placehold.co/600x800.png'];
        }

        const newProductRef = push(dbRef(database, 'products'));
        const newId = newProductRef.key;
        if (!newId) {
             return { error: 'Failed to generate a new product ID from Firebase.' };
        }

        const productToSave: Product = {
            ...productData,
            id: newId,
            images: imageUrls,
        };

        await set(newProductRef, productToSave);

        return { success: `Successfully added product: ${productToSave.name}` };

    } catch (error: any) {
        console.error('Failed to add product:', error);
        let errorMessage = error.message || 'An unknown error occurred while adding the product.';
        if (error.code === 'database/permission-denied') {
            errorMessage = "Permission denied for Firebase Realtime Database. Please check your Database security rules.";
        }
        return { error: errorMessage };
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
