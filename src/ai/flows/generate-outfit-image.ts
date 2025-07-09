
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
      const prompt = `You are a highly precise AI photo-editing tool. Your only function is to replace clothing in a photograph. You must follow these rules without exception.

**CRITICAL RULES - VIOLATING THESE RULES WILL RESULT IN FAILURE:**
1.  **PRESERVE THE PERSON:** The person's face, facial expression, hair, pose, and body shape MUST remain 100% identical to the original photo. The person must be perfectly recognizable. DO NOT change the person in any way.
2.  **PRESERVE THE BACKGROUND:** The background, lighting, and all other elements of the photo MUST NOT be changed.
3.  **REPLACE CLOTHING ONLY:** Your one and only task is to replace the clothes the person is currently wearing. The new outfit must be a full, complete look (e.g., a shirt and pants) and should be modern streetwear. This is the only change allowed.
4.  **MAINTAIN REALISM:** The final image must look like a realistic, unedited photograph of the original person in the original setting, but wearing the new outfit. DO NOT add any artistic filters or effects.

Process the following photo according to these rules. Edit the photo directly and keep the user's face.

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
