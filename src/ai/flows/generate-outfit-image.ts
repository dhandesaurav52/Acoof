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
  height: z.string().optional().describe("The user's height, e.g., 5'10\" or 178cm."),
  bodyType: z.string().optional().describe("The user's body type, e.g., Slim, Fit, Healthy, Fat."),
});
export type OutfitImagesInput = z.infer<typeof OutfitImagesInputSchema>;

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
  input: OutfitImagesInput
): Promise<z.infer<typeof OutfitImagesOutputSchema>> {
  const outfitImagesFlow = ai.defineFlow(
    {
      name: 'outfitImagesFlow',
      inputSchema: OutfitImagesInputSchema,
      outputSchema: OutfitImagesOutputSchema,
    },
    async (flowInput) => {
      const model = 'googleai/gemini-2.0-flash-preview-image-generation';
      
      let userDetails = "";
      if (flowInput.height || flowInput.bodyType) {
        userDetails += "The user has provided the following physical details to help you tailor the fit of the clothing:\n";
        if (flowInput.height) {
            userDetails += `- Height: ${flowInput.height}\n`;
        }
        if (flowInput.bodyType) {
            userDetails += `- Body Type: ${flowInput.bodyType}\n`;
        }
      }

      const basePrompt = `You are an expert AI photo editor performing a virtual try-on. Your only job is to change the clothes in the user's photo while keeping the person identical.

${userDetails}
**CRITICAL RULES:**
1.  **DO NOT CHANGE THE PERSON:** You must use the user's actual face, body, and pose from the provided photo. Do not generate a new person or a new face. All facial features, including beards, glasses, and hairstyle, must be preserved exactly as they are in the original photo.
2.  **REPLACE THE CLOTHING:** Generate a new, complete, and stylish full-body outfit on the person from the photo as described. The outfit should be appropriate for the provided height and body type if specified.
3.  **SHOW THE FULL OUTFIT:** The final image must show the person from head to toe.
4.  **MAINTAIN REALISM:** The final image, with the new clothes, must look photorealistic.
5.  **FACE CLARITY:** The person's face must be clear, in-focus, and not blurry or distorted in any way.

Generate one new image that follows these rules.`;

      const outfitPrompts = [
        `The outfit must be a **modern take on classic western wear**. Think a well-fitted denim jacket over a simple t-shirt, dark wash jeans, and stylish leather boots.`,
        `The outfit must be **elevated rancher style**. Think a clean button-down shirt (perhaps a subtle plaid or chambray), fitted trousers, and a high-quality leather belt.`,
        `The outfit must be **rugged yet refined**. Think a premium henley shirt, a well-worn leather jacket, and slim-fit jeans. The overall look should feel authentic and stylishly modern.`
      ];

      try {
        const imagePromises = outfitPrompts.map((stylePrompt) => 
          ai.generate({
            model,
            prompt: [
                { text: `${basePrompt}\n\n**OUTFIT STYLE:**\n${stylePrompt}` },
                { media: { url: flowInput.photoDataUri } }
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

  return await outfitImagesFlow(input);
}
