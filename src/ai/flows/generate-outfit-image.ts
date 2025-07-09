
'use server';
/**
 * @fileOverview A Genkit flow for generating an image of a person wearing a specified outfit.
 *
 * - generateOutfitImage - A function that generates an image based on a text prompt.
 * - GenerateOutfitImageInput - The input type for the generateOutfitImage function.
 * - GenerateOutfitImageOutput - The return type for the generateOutfitImage function.
 */
import {ai} from '@/ai/dev';
import {z} from 'genkit';

const GenerateOutfitImageInputSchema = z.object({
  prompt: z.string().describe('A detailed description of the outfit to generate an image for.'),
});
export type GenerateOutfitImageInput = z.infer<typeof GenerateOutfitImageInputSchema>;

const GenerateOutfitImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateOutfitImageOutput = z.infer<typeof GenerateOutfitImageOutputSchema>;

export async function generateOutfitImage(
  input: GenerateOutfitImageInput
): Promise<GenerateOutfitImageOutput> {
  // This is the critical check to prevent build failures.
  // It ensures that we don't try to use the AI model if the key isn't configured.
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("The AI feature is not configured on the server. The GOOGLE_API_KEY may be missing from your project's environment variables.");
  }

  // The flow is now defined at runtime, inside the function call.
  // This prevents the build process from crashing, as this code is never executed during build.
  const generateOutfitImageFlow = ai.defineFlow(
    {
      name: 'generateOutfitImageFlow_runtime',
      inputSchema: GenerateOutfitImageInputSchema,
      outputSchema: GenerateOutfitImageOutputSchema,
    },
    async ({prompt}) => {
      try {
          const {media} = await ai.generate({
              model: 'googleai/gemini-2.0-flash-preview-image-generation',
              prompt: `A full-body photograph of a fashion model wearing the following outfit: ${prompt}. The photo should be professional, with a clean, minimalist background.`,
              config: {
                  responseModalities: ['TEXT', 'IMAGE'],
              },
          });

          if (!media || !media.url) {
              throw new Error('Image generation failed to produce an output.');
          }

          return {
              imageUrl: media.url,
          };
      } catch (error: any) {
          console.error('Error in generateOutfitImageFlow:', error);
          throw new Error(`Failed to generate outfit image: ${error.message}`);
      }
    }
  );

  // Immediately invoke the just-in-time defined flow.
  return generateOutfitImageFlow(input);
}
