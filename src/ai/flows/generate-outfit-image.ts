
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
      
      const basePrompt = `You are an expert AI photo editor performing a virtual try-on. Your only job is to change the clothes in the user's photo while keeping the person identical.

**CRITICAL RULES:**
1.  **DO NOT CHANGE THE PERSON:** You must use the user's actual face, body, and pose from the provided photo. Do not generate a new person or a new face. All facial features, including beards, glasses, and hairstyle, must be preserved exactly as they are in the original photo.
2.  **REPLACE THE CLOTHING:** Generate a new, complete, and stylish full-body outfit on the person from the photo as described.
3.  **SHOW THE FULL OUTFIT:** The final image must show the person from head to toe.
4.  **MAINTAIN REALISM:** The final image, with the new clothes, must look photorealistic.

Generate one new image that follows these rules.`;

      const outfitPrompts = [
        `The outfit must be **modern men's streetwear**. Think hoodies, sneakers, and graphic tees.`,
        `The outfit must be **smart casual**. Think blazers, chinos, and clean leather shoes.`,
        `The outfit must be **minimalist and modern**. Think clean lines, neutral colors, and simple silhouettes.`
      ];

      try {
        const imagePromises = outfitPrompts.map((stylePrompt) => 
          ai.generate({
            model,
            prompt: [
                { text: `${basePrompt}\n\n**OUTFIT STYLE:**\n${stylePrompt}` },
                { media: { url: input.photoDataUri } }
            ],
            config: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          })
        );
        
        const results = await Promise.all(imagePromises);

        const images = results
            .map(result => result.media?.url)
            .filter((url): url is string => !!url);
        
        if (images.length < 3) {
            console.error(`AI Generation Incomplete. Expected 3 images, but got ${images.length}. API Results:`, JSON.stringify(results, null, 2));
            throw new Error(`The AI was unable to generate all 3 outfits. This can happen if the photo is unclear or triggers a safety filter. Please try again with a different photo.`);
        }

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
