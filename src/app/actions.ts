'use server';

import { generateOutfitSuggestions } from '@/ai/flows/generate-outfit-suggestions';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Product } from '@/types';

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

export async function addProduct(formData: FormData): Promise<{ success?: boolean; error?: string; product?: Partial<Product> }> {
  const productName = formData.get('productName') as string;
  const productDescription = formData.get('productDescription') as string;
  const productPrice = formData.get('productPrice') as string;
  const productCategory = formData.get('productCategory') as string;
  const isNew = formData.get('isNew') === 'true';
  const imageFiles = formData.getAll('images') as File[];

  if (!productName || !productDescription || !productPrice || !productCategory) {
    return { error: 'Please fill out all required fields.' };
  }

  if (!storage) {
    return { error: 'Firebase Storage is not configured. Cannot upload images.' };
  }

  try {
    let imageUrls: string[] = [];
    if (imageFiles.length > 0 && imageFiles[0].size > 0) {
      const uploadPromises = imageFiles.map(async (file) => {
        const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      });
      imageUrls = await Promise.all(uploadPromises);
    } else {
      imageUrls.push('https://placehold.co/600x800.png');
    }

    const newProduct: Partial<Product> = {
      name: productName,
      description: productDescription,
      price: parseFloat(productPrice),
      category: productCategory as Product['category'],
      isNew,
      images: imageUrls,
      aiHint: productName.toLowerCase()
    };
    
    // In a real app, this is where you would save the newProduct object to a database (e.g., Firestore).
    console.log("New Product Added:", newProduct);

    return { success: true, product: newProduct };

  } catch (error: any) {
    console.error('Failed to add product:', error);
    return { error: error.message || 'An unknown error occurred during file upload.' };
  }
}