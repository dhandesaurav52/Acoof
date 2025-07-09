
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
    .describe('An array of one or more distinct outfit images as data URIs.'),
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
      const prompt = `You are an expert AI photo editor performing a virtual try-on. Your only job is to change the clothes in the user's photo while keeping the person identical.

**CRITICAL RULES:**
1.  **DO NOT CHANGE THE PERSON:** You must use the user's actual face, body, and pose from the provided photo. Do not generate a new person or a new face. All facial features, including beards, glasses, and hairstyle, must be preserved exactly as they are in the original photo.
2.  **REPLACE THE CLOTHING:** Generate a new, complete, and stylish full-body outfit on the person from the photo. The outfit must be modern men's streetwear.
3.  **SHOW THE FULL OUTFIT:** The final image must show the person from head to toe.
4.  **MAINTAIN REALISM:** The final image, with the new clothes, must look photorealistic.

You will be given a user's photo. Generate one new image that follows these rules.

User's Photo: {{media url=photoDataUri}}`;

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

        // Filter out any failed generations instead of throwing an error immediately.
        const images = results
            .map(result => result.media?.url)
            .filter((url): url is string => !!url);
        
        // If all image generations fail, then we throw an error.
        if (images.length === 0) {
            console.error("AI Generation Failed. All attempts returned no image. API Results:", JSON.stringify(results, null, 2));
            throw new Error('The AI was unable to generate any outfits. This can happen if the photo is unclear or triggers a safety filter. Please try again with a different photo.');
        }

        // Return the successfully generated images, even if it's less than 3.
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
