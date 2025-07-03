
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


const generateOutfitImageFlow = ai.defineFlow(
    {
        name: 'generateOutfitImageFlow',
        inputSchema: GenerateOutfitImageInputSchema,
        outputSchema: GenerateOutfitImageOutputSchema,
    },
    async (input) => {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: `Generate a photorealistic, full-body image of a male model wearing the following outfit. The model should be in a modern, urban setting. The image should be high-quality and suitable for a fashion lookbook. Outfit description: ${input.description}`,
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
