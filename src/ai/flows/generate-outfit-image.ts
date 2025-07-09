
'use server';
/**
 * @fileOverview An AI flow to generate outfit images based on a user's photo.
 *
 * - generateOutfitImages - A function that takes a photo data URI and returns three generated outfit images.
 */

import { ai } from '@/ai/dev';
import { z } from 'zod';

const OutfitImagesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

const OutfitImagesOutputSchema = z.object({
  images: z
    .array(
      z
        .string()
        .describe(
          "A generated image of a person in a new outfit, as a data URI."
        )
    )
    .length(3)
    .describe('An array of three distinct outfit images as data URIs.'),
});

export async function generateOutfitImages(
  photoDataUri: string
): Promise<z.infer<typeof OutfitImagesOutputSchema>> {
  const outfitImagesFlow = ai.defineFlow(
    {
      name: 'outfitImagesFlow',
      inputSchema: OutfitImagesInputSchema,
      outputSchema: OutfitImagesOutputSchema,
    },
    async (input) => {
      const model = 'googleai/gemini-2.0-flash-preview-image-generation';
      const prompt = `You are a sophisticated AI photo editor specializing in virtual try-on. Your task is to edit the provided photo of a person.

**CRITICAL INSTRUCTIONS:**
1.  **DO NOT change the person's face, hair, body shape, or pose.** The original person must be perfectly recognizable.
2.  **DO NOT change the background of the photo.** Keep the original background intact.
3.  Your ONLY task is to **replace the clothing** the person is currently wearing with a stylish, complete, modern streetwear outfit.
4.  The final image should look like a realistic photograph of the original person wearing the new outfit in the original setting.

Photo to edit: {{media url=photoDataUri}}`;

      try {
        // Generate three images in parallel
        const imagePromises = Array(3).fill(null).map(() => 
          ai.generate({
            model,
            prompt,
            config: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          })
        );
        
        const results = await Promise.all(imagePromises);

        const images = results.map(result => {
          if (!result.media || !result.media.url) {
            throw new Error('AI failed to generate a valid image.');
          }
          return result.media.url;
        });

        return { images };

      } catch (error: any) {
        console.error("Error in image generation flow:", error);
        // Re-throw the error to be caught by the frontend for user feedback
        throw error;
      }
    }
  );

  return await outfitImagesFlow({ photoDataUri });
}
