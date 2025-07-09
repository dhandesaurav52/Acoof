'use server';
/**
 * @fileOverview An AI flow to generate an outfit image based on a text prompt.
 *
 * - generateOutfitImage - A function that takes a text prompt and returns a generated image data URI.
 */

import { ai } from '@/ai/dev';
import { z } from 'zod';

// This function is the only export. All Genkit definitions are inside it.
export async function generateOutfitImage(
  promptText: string
): Promise<{ imageUrl: string }> {
  // Define schemas inside the function so they are not exported.
  const OutfitPromptInputSchema = z.object({
    prompt: z.string().describe('A detailed description of a fashion outfit.'),
  });

  const OutfitPromptOutputSchema = z.object({
    imageUrl: z
      .string()
      .describe(
        "The generated image as a data URI: 'data:image/png;base64,<b64_encoded_image>'"
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
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `A full-body, professional fashion photograph of a male model wearing the following outfit, against a clean, minimalist studio background: ${input.prompt}`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (!media?.url) {
        throw new Error('Image generation failed to return an image.');
      }

      return { imageUrl: media.url };
    }
  );

  // Execute the flow.
  const result = await generateImageFlow({ prompt: promptText });
  return result;
}
