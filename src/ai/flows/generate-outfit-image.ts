
'use server';
/**
 * @fileOverview A Genkit flow for generating an image of a person wearing a specified outfit.
 *
 * - generateOutfitImage - A function that generates an image based on a text prompt and an optional user image.
 * - GenerateOutfitImageInput - The input type for the generateOutfitImage function.
 * - GenerateOutfitImageOutput - The return type for the generateOutfitImage function.
 */
import {ai} from '@/ai/dev';
import {z} from 'genkit';

const GenerateOutfitImageInputSchema = z.object({
  prompt: z.string().describe('A detailed description of the outfit to generate an image for.'),
  userImageDataUri: z
    .string()
    .optional()
    .describe(
      "An optional photo of a person, as a data URI. If provided, the generated image will feature this person. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
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
    async (input) => {
      const promptTemplate = `You are an expert fashion stylist. Your goal is to generate a new image of a person wearing an outfit based on the text description provided.
{{#if userImageDataUri}}
Critically, the person in the generated image MUST be the same person as in the reference image provided. Do not change their appearance. Place them in the described outfit.
Reference Image: {{media url=userImageDataUri}}
{{/if}}
Outfit Description: {{{prompt}}}
The final image should be a full-body photograph of the person in the described outfit. The photo should be professional, with a clean, minimalist background suitable for a fashion lookbook.`;
      
      try {
          const {media} = await ai.generate({
              model: 'googleai/gemini-2.0-flash-preview-image-generation',
              prompt: [{
                text: promptTemplate,
                context: input
              }],
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
