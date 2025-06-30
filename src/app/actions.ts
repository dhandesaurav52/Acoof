
'use server';

import { generateOutfitSuggestions } from '@/ai/flows/generate-outfit-suggestions';
import { storage, database } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, set, push, get } from "firebase/database";
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

export async function addProduct(formData: FormData): Promise<{ success?: boolean; error?: string; product?: Product }> {
  // Rigorous validation at the start
  const productName = formData.get('productName');
  const productDescription = formData.get('productDescription');
  const productPrice = formData.get('productPrice');
  const productCategory = formData.get('productCategory');
  
  if (typeof productName !== 'string' || !productName ||
      typeof productDescription !== 'string' || !productDescription ||
      typeof productPrice !== 'string' || !productPrice ||
      typeof productCategory !== 'string' || !productCategory) {
    return { error: 'Required fields are missing or have an invalid type.' };
  }

  const price = parseFloat(productPrice);
  if (isNaN(price)) {
    return { error: 'Invalid price. Please enter a valid number.' };
  }

  if (!storage || !database) {
    return { error: 'Firebase is not configured. Cannot add product.' };
  }

  try {
    let imageUrls: string[] = [];
    const imageFileEntries = formData.getAll('images');
    const validImageFiles = imageFileEntries.filter(
      (entry): entry is File => entry instanceof File && entry.size > 0
    );

    if (validImageFiles.length > 0) {
      const uploadPromises = validImageFiles.map(async (file) => {
        const fileRef = storageRef(storage, `products/${Date.now()}-${file.name}`);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
      });
      imageUrls = await Promise.all(uploadPromises);
    } else {
      imageUrls.push('https://placehold.co/600x800.png');
    }

    const productsRef = dbRef(database, 'products');
    const newProductRef = push(productsRef);
    
    if (!newProductRef.key) {
      throw new Error("Could not create a reference for a new product in the database.");
    }
    const newProductId = newProductRef.key;
    
    const productColorsRaw = formData.get('productColors');
    const productSizesRaw = formData.get('productSizes');

    const newProduct: Product = {
      id: newProductId,
      name: productName,
      description: productDescription,
      price: price,
      category: productCategory as Product['category'],
      isNew: formData.get('isNew') === 'true',
      images: imageUrls,
      aiHint: productName.toLowerCase(),
      colors: typeof productColorsRaw === 'string' && productColorsRaw ? productColorsRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
      sizes: typeof productSizesRaw === 'string' && productSizesRaw ? productSizesRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
    };
    
    await set(newProductRef, newProduct);

    return { success: true, product: newProduct };

  } catch (error: unknown) {
    console.error('An error occurred in addProduct:', error);
    
    let errorMessage = 'An unexpected error occurred during product creation.';
    if (error instanceof Error) {
        errorMessage = error.message;
        const firebaseError = error as any;
        if (firebaseError.code) {
             switch (firebaseError.code) {
                case 'storage/unauthorized':
                case 'storage/permission-denied':
                  errorMessage = "Permission denied for Firebase Storage. Please check your security rules.";
                  break;
                case 'database/permission-denied':
                   errorMessage = "Permission denied for Firebase Database. Please check your security rules.";
                   break;
                default:
                  errorMessage = `A Firebase error occurred: ${firebaseError.code} - ${firebaseError.message}`;
                  break;
            }
        }
    } else if (typeof error === 'string') {
        errorMessage = error;
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
      await set(productsRef, productsToSeed);
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
