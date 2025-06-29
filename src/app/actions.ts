'use server';

import { generateOutfitSuggestions } from '@/ai/flows/generate-outfit-suggestions';

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
