
'use server';
/**
 * @fileOverview A Genkit flow for generating stylish outfits on a person from a photo.
 *
 * - generateOutfitImage - A function that generates three images based on a user's photo.
 */
import { ai } from '@/ai/dev';
import { z } from 'genkit';

// Define the Zod schemas at the top level, but do not export them.
// Next.js allows non-async function values in a 'use server' file as long as they are not exported.
const GenerateOutfitImageInputSchema = z.object({
  userImageDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI. The generated image will feature this person in a new outfit. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

const GenerateOutfitImageOutputSchema = z.object({
  imageUrls: z.array(z.string()).describe('A list of data URIs for the three generated images.'),
});

// The defined flow is an object. It is NOT exported, so it doesn't violate the rule.
const generateOutfitImageFlow = ai.defineFlow(
  {
    name: 'generateOutfitImageFlow',
    inputSchema: GenerateOutfitImageInputSchema,
    outputSchema: GenerateOutfitImageOutputSchema,
  },
  async (flowInput) => {
    // This is a critical safeguard. If the API key is not present, the function
    // will throw an error at runtime, but it will not crash the build process.
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("The AI feature is not configured on the server. The GOOGLE_API_KEY may be missing from your project's environment variables.");
    }

    try {
      const basePrompt = `You are an expert fashion stylist. Your goal is to generate a new image of a person wearing a stylish and modern outfit.
Critically, the person in the generated image MUST be the same person as in the reference image provided. Do not change their appearance. Place them in a completely new, fashionable outfit.
The final image should be a full-body photograph of the person in the new outfit. The photo should be professional, with a clean, minimalist background.`;

      const outfitPrompts = [
          `${basePrompt} The outfit should be trendy STREETWEAR.`,
          `${basePrompt} The outfit should be a sharp SMART CASUAL look.`,
          `${basePrompt} The outfit should be an elegant, MINIMALIST style.`,
      ];

      const generationPromises = outfitPrompts.map(promptText => 
        ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: [
            { text: promptText },
            { media: { url: flowInput.userImageDataUri } }
          ],
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        })
      );
      
      const results = await Promise.all(generationPromises);
      
      const imageUrls = results.map(result => {
        if (!result.media || !result.media.url) {
          throw new Error('One or more image generations failed to produce an output.');
        }
        return result.media.url;
      });

      return { imageUrls };

    } catch (error: any) {
      console.error('Error in generateOutfitImageFlow:', error);
      let message = `Failed to generate outfit image: ${error.message || 'An unknown error occurred.'}`;
      if (error.message?.includes('PERMISSION_DENIED')) {
          message = 'AI service permission denied. This often means the Generative AI API is not enabled in your Google Cloud project. Please check your project settings.';
      }
      throw new Error(message);
    }
  }
);

// This is the ONLY export from the file. It's an async function, which is allowed.
// The input and output types are inferred by TypeScript and don't need to be explicitly exported.
export async function generateOutfitImage(
  input: { userImageDataUri: string }
): Promise<{ imageUrls: string[] }> {
  return generateOutfitImageFlow(input);
}
