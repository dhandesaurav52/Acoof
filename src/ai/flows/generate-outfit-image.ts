
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
      const prompt = `You are an expert AI photo editor. Your task is to perform a virtual try-on by editing the provided photograph.

**Your Goal:** Modify the photo to show the person wearing a new, complete, stylish, modern streetwear outfit.

**Critical Rules - DO NOT BREAK:**
1.  **Keep the Person Identical:** The person's face, hair, body shape, and pose MUST remain exactly as they are in the original photo. The person must be perfectly recognizable.
2.  **Keep the Background:** The background of the photo must NOT be changed.
3.  **Only Change Clothes:** The *only* modification you are allowed to make is to replace the clothes the person is currently wearing. The new outfit should be a full, complete look (e.g., shirt and pants, not just a t-shirt).

The final image must look like a realistic photograph of the *original person* in the *original setting*, just wearing a different outfit.

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
