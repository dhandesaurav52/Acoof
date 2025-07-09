
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
      const prompt = `You are an expert AI fashion stylist and photo editor. Your task is to perform a virtual try-on for a user. You must follow this process exactly:

1.  **Analyze the User's Photo:** The provided image contains a user's face. Carefully analyze their facial features, expression, and skin tone.
2.  **Generate a New Scene:** Create a realistic, full-body image of a male model wearing a stylish, complete, modern streetwear outfit. The model should be in a natural pose against a simple, neutral background.
3.  **Merge the Face:** Seamlessly replace the generated model's face with the user's face from the original photo. The user's head, hair, and facial expression must be perfectly preserved and blended realistically onto the model's body. The final result should look like a natural, unedited photograph of the user.
4.  **Ensure Full Outfit:** The generated image must show a full outfit, including top, bottom, and appropriate footwear.

**CRITICAL RULES:**
-   **MENSWEAR ONLY:** All generated outfits must be men's clothing.
-   **PRESERVE THE FACE:** The user's face from the original photo is the most important element. It MUST be used on the final image. Do not generate a new face.
-   **REALISM:** The final image must be photorealistic.

Process the following photo and generate one image based on these instructions.

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
