
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
2.  **SHOW THE FULL OUTFIT:** Generate a new, complete, stylish, and full-body outfit. The final image MUST show the person from head to toe, including good shoes.
3.  **FACE CLARITY:** The person's face MUST be clear, in-focus, and not blurry or distorted in any way.
4.  **MAINTAIN REALISM:** The final image, with the new clothes, must look photorealistic.

Generate one new image that follows these rules.`;

      const outfitPrompts = [
        `A stylish **jacket-centric outfit**. This could feature a sleek leather jacket, a modern bomber jacket, or a classic denim jacket. Pair it with good, stylish jeans or pants and appropriate fashionable footwear for a complete, fashionable look.`,
        `A sophisticated **blazer outfit**. The look should be modern and sharp, suitable for a smart-casual setting. The blazer should be the centerpiece, paired with well-fitting trousers or smart jeans and stylish shoes.`,
        `A fashionable **hip-hop style outfit**. This should reflect modern streetwear trends. Think designer hoodies, graphic tees, baggy or distressed hip-hop style jeans, and iconic sneakers. The overall vibe should be cool, confident, and on-trend.`
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
