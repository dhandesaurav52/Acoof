
'use server';
/**
 * @fileOverview An AI flow to generate outfit images based on a user's photo.
 *
 * - generateOutfitImages - A function that takes a photo data URI and returns three generated outfit images.
 */

import type { AIMedia, TextPart } from 'genkit';
import { z } from 'zod';
import type { OutfitImagesInput } from '@/types';
import { OutfitImagesInputSchema, OutfitImagesOutputSchema } from '@/types';
import { ai } from '@/ai/genkit'; // Import the central AI instance

// This helper function constructs the multi-modal prompt for the AI.
const getOutfitImagePrompt = (
  basePrompt: string,
  stylePrompt: string,
  photoDataUri: string
): (TextPart | AIMedia)[] => {
  return [
    { text: `${basePrompt}\n\n**OUTFIT STYLE:**\n${stylePrompt}` },
    { media: { url: photoDataUri } },
  ];
};

// Define the main flow for generating outfits.
const outfitImagesFlow = ai.defineFlow(
  {
    name: 'outfitImagesFlow',
    inputSchema: OutfitImagesInputSchema,
    outputSchema: OutfitImagesOutputSchema,
  },
  async (flowInput) => {
    
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

    const basePrompt = `You are an expert AI photo editor performing a virtual try-on. Your only job is to change the clothes on the person in the photo while keeping the person and the background identical.

${userDetails}
**CRITICAL RULES:**
1.  **DO NOT CHANGE THE PERSON:** You must use the user's actual face, body, and pose from the provided photo. Do not generate a new person. All facial features (including glasses, beards, makeup) and hairstyle must be preserved exactly as they are in the original photo. The original person must be clearly recognizable.
2.  **SHOW THE FULL OUTFIT:** Generate a new, complete, stylish, and full-body outfit. The final image MUST show the person from head to toe, including cool, fashionable shoes that match the outfit.
3.  **FACE CLARITY & REALISM:** The person's face MUST be clear, in-focus, and not blurry, distorted, or changed in any way. The final image, with the new clothes, must look photorealistic and high-quality.
4.  **BACKGROUND:** Keep the background identical to the original photo. Do not change it.

Generate one new image that follows these rules.`;

    const outfitPrompts = [
      `A cool, modern **jacket-centric outfit**. This could feature a sleek leather jacket, a contemporary bomber jacket, or a stylish denim jacket. Pair it with well-fitting, fashionable jeans or pants and appropriate trendy footwear for a complete, cool look.`,
      `A sophisticated and cool **blazer outfit**. The look should be modern, sharp, and stylish, suitable for a smart-casual or evening setting. The blazer should be the centerpiece, paired with well-fitting trousers or smart jeans and stylish shoes.`,
      `A cool, modern **hip-hop style outfit**. This should reflect current streetwear trends. Think designer hoodies, graphic tees, baggy or distressed hip-hop style jeans, and iconic sneakers. The overall vibe should be confident, on-trend, and effortlessly cool.`
    ];

    const generatedImages: string[] = [];

    try {
      // Generate images sequentially to avoid timeouts and rate limiting issues on deployed environment.
      for (const stylePrompt of outfitPrompts) {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: getOutfitImagePrompt(basePrompt, stylePrompt, flowInput.photoDataUri),
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });

        const imageUrl = media?.url;
        if (imageUrl) {
          generatedImages.push(imageUrl);
        } else {
            // Log the partial failure but continue
            console.error(`AI Generation failed for one style. Result did not contain a media URL.`);
        }
      }
      
      if (generatedImages.length < 3) {
          console.error(`AI Generation Incomplete. Expected 3 images, but got ${generatedImages.length}.`);
          // We still return what we have, but throw an error so the user knows it was incomplete.
          throw new Error(`The AI was unable to generate all 3 outfits. This can happen if the photo is unclear or triggers a safety filter. Please try again with a different photo.`);
      }

      return { images: generatedImages };

    } catch (error: any) {
      console.error("Error in image generation flow:", error);
      // Re-throw the error to be caught by the frontend for user feedback
      throw error;
    }
  }
);


// This is the exported function that the client component will call.
export async function generateOutfitImages(
  input: OutfitImagesInput
): Promise<z.infer<typeof OutfitImagesOutputSchema>> {
    return await outfitImagesFlow(input);
}
