
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

  if (!storage) {
    return { error: 'Firebase Storage is not configured. Cannot upload images.' };
  }

  try {
    let imageUrls: string[] = [];
    
    // Robustly handle file uploads
    const imageFileEntries = formData.getAll('images');
    const validImageFiles = imageFileEntries.filter(
        (entry): entry is File => entry instanceof File && entry.size > 0
    );

    if (validImageFiles.length > 0) {
      const uploadPromises = validImageFiles.map(async (file) => {
        const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      });
      imageUrls = await Promise.all(uploadPromises);
    } else {
      // Use a placeholder if no valid files are uploaded
      imageUrls.push('https://placehold.co/600x800.png');
    }

    const newProduct: Product = {
      id: Date.now(),
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
    
    console.log("New Product Added:", newProduct);

    return { success: true, product: newProduct };

  } catch (error: any) {
    console.error('Failed to add product:', error);
    return { error: error.message || 'An unknown error occurred during file upload.' };
  }
}
