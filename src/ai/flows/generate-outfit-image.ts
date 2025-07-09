'use server';
/**
 * @fileOverview An AI flow to generate outfit images based on a user's photo.
 *
 * - generateOutfitImage - A function that takes a photo data URI and returns three generated outfit image data URIs.
 */

import { ai } from '@/ai/dev';
import { z } from 'zod';

// This function is the only export. All Genkit definitions are inside it.
export async function generateOutfitImage(
  photoDataUri: string
): Promise<{ imageUrls: string[] }> {
  // Define schemas inside the function so they are not exported.
  const OutfitPromptInputSchema = z.object({
    photoDataUri: z
      .string()
      .describe(
        "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
  });

  const OutfitPromptOutputSchema = z.object({
    imageUrls: z
      .array(z.string())
      .length(3)
      .describe(
        "An array of three generated images as data URIs. Each string should be in the format: 'data:image/png;base64,<b64_encoded_image>'"
      ),
  });

  // Define the image generation flow inside the function.
  const generateImageFlow = ai.defineFlow(
    {
      name: 'generateOutfitImageFlow',
      inputSchema: OutfitPromptInputSchema,
      outputSchema: OutfitPromptOutputSchema,
    },
    async (input) => {
      // Define three different style prompts to generate varied outfits.
      const stylePrompts = [
        'a professional fashion photograph of this person in a stylish streetwear outfit, against a clean, minimalist studio background. The outfit should be trendy and casual.',
        'a professional fashion photograph of this person in a smart casual outfit, suitable for a day at the office or a casual dinner, against a clean, minimalist studio background.',
        'a professional fashion photograph of this person in an elegant evening wear outfit, perfect for a formal event, against a clean, minimalist studio background.',
      ];

      // Generate three images in parallel.
      const imagePromises = stylePrompts.map((promptText) =>
        ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: [
            { media: { url: input.photoDataUri } },
            { text: promptText },
          ],
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        })
      );

      const results = await Promise.all(imagePromises);

      const imageUrls = results.map((result) => {
        if (!result.media?.url) {
          throw new Error('Image generation failed to return an image for one of the styles.');
        }
        return result.media.url;
      });

      return { imageUrls };
    }
  );

  // Execute the flow.
  const result = await generateImageFlow({ photoDataUri });
  return result;
}
