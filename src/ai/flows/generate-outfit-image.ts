
'use server';
/**
 * @fileOverview An AI flow to generate outfit descriptions based on a user's photo.
 *
 * - generateOutfitIdeas - A function that takes a photo data URI and returns three text-based outfit ideas.
 */

import { ai } from '@/ai/dev';
import { z } from 'zod';

export async function generateOutfitIdeas(
  photoDataUri: string
): Promise<{ ideas: string[] }> {

  const OutfitIdeasInputSchema = z.object({
    photoDataUri: z
      .string()
      .describe(
        "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
  });

  const OutfitIdeasOutputSchema = z.object({
    ideas: z
      .array(
        z.string().describe('A detailed description of a complete outfit, including items of clothing, accessories, and a style name.')
      )
      .length(3)
      .describe('An array of three distinct and detailed outfit descriptions.'),
  });

  const outfitIdeasFlow = ai.defineFlow(
    {
      name: 'outfitIdeasFlow',
      inputSchema: OutfitIdeasInputSchema,
      outputSchema: OutfitIdeasOutputSchema,
    },
    async (input) => {
      const prompt = ai.definePrompt({
        name: 'outfitIdeasPrompt',
        input: { schema: OutfitIdeasInputSchema },
        output: { schema: OutfitIdeasOutputSchema },
        model: 'googleai/gemini-pro-vision',
        prompt: `You are an expert fashion stylist. Based on the person in the photo, generate three distinct and detailed outfit descriptions.

For each outfit, describe the clothing items, accessories, and a catchy name for the style (e.g., "Urban Explorer", "Coastal Casual", "Monochrome Minimalist"). Be descriptive and inspiring.

Your response must be structured as a JSON object with a single key "ideas" containing an array of three strings.

Photo: {{media url=photoDataUri}}`,
      });
      
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The AI failed to generate outfit ideas.');
      }
      return output;
    }
  );

  const result = await outfitIdeasFlow({ photoDataUri });
  return result;
}
