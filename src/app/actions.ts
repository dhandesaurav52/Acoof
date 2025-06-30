
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
  const productName = formData.get('productName') as string;
  const productDescription = formData.get('productDescription') as string;
  const productPrice = formData.get('productPrice') as string;
  const productCategory = formData.get('productCategory') as string;
  const productColors = formData.get('productColors') as string;
  const productSizes = formData.get('productSizes') as string;
  const isNew = formData.get('isNew') === 'true';

  if (!productName || !productDescription || !productPrice || !productCategory) {
    return { error: 'Please fill out all required fields.' };
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
        const fileStorageRef = storageRef(storage, `products/${Date.now()}-${file.name}`);
        await uploadBytes(fileStorageRef, file);
        return getDownloadURL(fileStorageRef);
      });
      imageUrls = await Promise.all(uploadPromises);
    } else {
      imageUrls.push('https://placehold.co/600x800.png');
    }

    const productsRef = dbRef(database, 'products');
    const newProductRef = push(productsRef);
    
    if (!newProductRef || !newProductRef.key) {
        throw new Error("Could not create a reference for a new product.");
    }

    const newProductId = newProductRef.key;

    const newProduct: Product = {
      id: newProductId,
      name: productName,
      description: productDescription,
      price: price,
      category: productCategory as Product['category'],
      isNew,
      images: imageUrls,
      aiHint: productName.toLowerCase(),
      colors: productColors ? productColors.split(',').map(s => s.trim()).filter(Boolean) : [],
      sizes: productSizes ? productSizes.split(',').map(s => s.trim()).filter(Boolean) : [],
    };
    
    await set(newProductRef, newProduct);

    return { success: true, product: newProduct };

  } catch (error: unknown) {
    console.error('An error occurred in addProduct:', error);
    
    let errorMessage = 'An unexpected error occurred during product creation.';
    
    if (error instanceof Error) {
        errorMessage = error.message;
        // Check for Firebase specific error codes
        const firebaseError = error as any;
        if (firebaseError.code) {
             switch (firebaseError.code) {
                case 'storage/unauthorized':
                case 'permission-denied':
                  errorMessage = "Permission denied. Please check your Firebase security rules for Storage and/or Database.";
                  break;
                case 'storage/object-not-found':
                  errorMessage = "File not found during upload. Please try again.";
                  break;
                default:
                  errorMessage = `An error occurred: ${firebaseError.message}`;
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
      const newProductRef = push(productsRef); // Generate a unique key
      const newId = newProductRef.key;
      if (newId) {
        productsToSeed[newId] = { ...product, id: newId };
      }
    });
    
    await set(productsRef, productsToSeed);

    return { success: `Successfully seeded ${staticProducts.length} products.` };
  } catch (error: any) {
    console.error('Database seeding failed:', error);
    return { error: 'An unknown error occurred during database seeding.' };
  }
}
