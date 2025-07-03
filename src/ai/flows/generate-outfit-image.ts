
'use server';

/**
 * @fileOverview A Genkit flow for generating an image of an outfit.
 * - generateOutfitImage - A function that handles the image generation process.
 * - GenerateOutfitImageInput - The input type for the generateOutfitImage function.
 * - GenerateOutfitImageOutput - The return type for the generateOutfitImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOutfitImageInputSchema = z.object({
  description: z.string().describe('A detailed description of the outfit to generate an image for.'),
  photoDataUri: z.string().optional().describe("An optional photo of a person as a data URI. If provided, the generated image will feature this person wearing the outfit. Format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateOutfitImageInput = z.infer<typeof GenerateOutfitImageInputSchema>;

const GenerateOutfitImageOutputSchema = z.object({
    imageUrl: z.string().describe("A data URI of the generated image. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateOutfitImageOutput = z.infer<typeof GenerateOutfitImageOutputSchema>;

export async function generateOutfitImage(
    input: GenerateOutfitImageInput
): Promise<GenerateOutfitImageOutput> {
    return generateOutfitImageFlow(input);
}

const imagePrompt = ai.definePrompt(
    {
        name: 'generateOutfitImagePrompt',
        input: { schema: GenerateOutfitImageInputSchema },
        prompt: `Generate a photorealistic image of {{#if photoDataUri}}the person from the provided photo{{else}}a fashion model{{/if}} wearing the described outfit.
{{#if photoDataUri}}
Maintain the person's features, body shape, and pose from the original photo.
Replace their current clothes with the new outfit, seamlessly blending it onto their body.
The background should be a simple, neutral studio setting to focus on the person and the outfit.
{{media url=photoDataUri}}
{{else}}
The model should be in a modern, urban setting. The image should be full-body.
{{/if}}
The final image must be high-quality and suitable for a fashion lookbook.

Outfit description: {{{description}}}`,
    }
);


const generateOutfitImageFlow = ai.defineFlow(
    {
        name: 'generateOutfitImageFlow',
        inputSchema: GenerateOutfitImageInputSchema,
        outputSchema: GenerateOutfitImageOutputSchema,
    },
    async (input) => {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: imagePrompt,
            input: input,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });
        
        if (!media || !media.url) {
            throw new Error('Image generation failed to return a valid image.');
        }

        return { imageUrl: media.url };
    }
);
