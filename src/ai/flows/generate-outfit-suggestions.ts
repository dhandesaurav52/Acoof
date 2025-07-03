
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized outfit suggestions with images based on user browsing history.
 *
 * The flow takes user browsing history as input and returns outfit suggestions with generated images.
 *   - generateOutfitSuggestions - A function that generates outfit suggestions.
 *   - GenerateOutfitSuggestionsInput - The input type for the generateOutfitSuggestions function.
 *   - GenerateOutfitSuggestionsOutput - The return type for the generateOutfitSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateOutfitImage } from './generate-outfit-image';

const GenerateOutfitSuggestionsInputSchema = z.object({
  browsingHistory: z
    .string()
    .describe(
      'A string containing the user browsing history, including viewed product names and categories.'
    ),
  photoDataUri: z.string().optional().describe("An optional photo of a person as a data URI. If provided, generated outfits will be shown on this person. Format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateOutfitSuggestionsInput = z.infer<typeof GenerateOutfitSuggestionsInputSchema>;

const SuggestionWithImageSchema = z.object({
    description: z.string().describe('A detailed description of the outfit.'),
    imageUrl: z.string().describe("A data URI of the generated image. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

const GenerateOutfitSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(SuggestionWithImageSchema)
    .describe('An array of outfit suggestions, each with a description and a generated image.'),
});
export type GenerateOutfitSuggestionsOutput = z.infer<typeof GenerateOutfitSuggestionsOutputSchema>;

export async function generateOutfitSuggestions(
  input: GenerateOutfitSuggestionsInput
): Promise<GenerateOutfitSuggestionsOutput> {
  return generateOutfitSuggestionsFlow(input);
}

const outfitDescriptionPrompt = ai.definePrompt({
  name: 'generateOutfitDescriptionsPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateOutfitSuggestionsInputSchema},
  output: {schema: z.object({
      suggestions: z
        .array(z.string())
        .describe('An array of 3 outfit suggestions, each a detailed description of an outfit.'),
    })
  },
  prompt: `You are a personal stylist for Acoof, specializing in creating personalized outfit suggestions.

Based on the user's browsing history, generate 3 creative and detailed outfit suggestions that complement their viewed items and align with current fashion trends. Describe each outfit clearly.

Browsing History: {{{browsingHistory}}}

Suggestions:`,
});

const generateOutfitSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateOutfitSuggestionsFlow',
    inputSchema: GenerateOutfitSuggestionsInputSchema,
    outputSchema: GenerateOutfitSuggestionsOutputSchema,
  },
  async input => {
    // 1. Get text-based suggestions first
    const { output } = await outfitDescriptionPrompt(input);
    if (!output?.suggestions) {
        return { suggestions: [] };
    }

    // 2. Generate an image for each suggestion in parallel
    const imageGenerationPromises = output.suggestions.map(description => 
        generateOutfitImage({ description, photoDataUri: input.photoDataUri })
    );

    const imageResults = await Promise.all(imageGenerationPromises);
    
    // 3. Combine descriptions with their generated images
    const suggestionsWithImages = output.suggestions.map((description, index) => ({
        description,
        imageUrl: imageResults[index].imageUrl,
    }));

    return { suggestions: suggestionsWithImages };
  }
);
