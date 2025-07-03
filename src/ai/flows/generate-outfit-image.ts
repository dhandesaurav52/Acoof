
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

const generateOutfitImageFlow = ai.defineFlow(
    {
        name: 'generateOutfitImageFlow',
        inputSchema: GenerateOutfitImageInputSchema,
        outputSchema: GenerateOutfitImageOutputSchema,
    },
    async (input) => {
        const { description, photoDataUri } = input;
        let prompt: any;

        if (photoDataUri) {
            prompt = [
                { media: { url: photoDataUri } },
                { text: `Task: Perform a virtual try-on.
You will receive a photo of a person and a description of an outfit. Your job is to generate a new, photorealistic image of that **exact same person** wearing the new outfit.

**Crucial Instructions:**
1.  **Identity Preservation:** You MUST preserve the person's identity from the original photo. Do not change their face, gender, ethnicity, body shape, or pose.
2.  **Outfit Replacement:** Seamlessly replace their original clothing with the outfit described below. The fit should look natural.
3.  **Background:** Place them in a simple, neutral studio background to keep the focus on the person and the clothes.
4.  **Quality:** The final image must be high-quality and photorealistic, suitable for a fashion lookbook.

**Outfit Description:** ${description}` }
            ];
        } else {
            prompt = `Generate a photorealistic image of a **male fashion model** wearing the described outfit.
The model should be in a modern, urban setting. The image should be full-body.
The final image must be high-quality and suitable for a fashion lookbook.

**Outfit Description:** ${description}`;
        }

        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: prompt,
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
