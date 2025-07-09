'use server';
/**
 * @fileOverview An AI flow for generating outfit suggestions.
 * - generateOutfitSuggestions - A function that generates outfit ideas.
 * - OutfitSuggestionsInput - The input type for the generateOutfitSuggestions function.
 * - OutfitSuggestionsOutput - The return type for the generateOutfitSuggestions function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const OutfitSuggestionsInputSchema = z.object({
  browsingHistory: z.string().describe('A summary of items and styles the user has recently viewed.'),
});
export type OutfitSuggestionsInput = z.infer<typeof OutfitSuggestionsInputSchema>;

export const OutfitSuggestionsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string().describe('A catchy title for the outfit suggestion, e.g., "Urban Explorer" or "Relaxed Weekend".'),
      description: z.string().describe('A short, compelling description of the outfit and why it works.'),
      products: z.array(z.string()).describe('A list of 3-5 product types that make up this outfit (e.g., "Slim-Fit Denim Jeans", "Classic White Tee", "Leather Derby Shoes").'),
    })
  ).describe('An array of 3 unique outfit suggestions.'),
});
export type OutfitSuggestionsOutput = z.infer<typeof OutfitSuggestionsOutputSchema>;

const stylistPrompt = ai.definePrompt({
  name: 'stylistPrompt',
  input: { schema: OutfitSuggestionsInputSchema },
  output: { schema: OutfitSuggestionsOutputSchema },
  prompt: `You are an expert fashion stylist for a modern menswear brand called Acoof. Your goal is to provide creative and appealing outfit suggestions to users.

Based on the user's browsing history, generate 3 unique outfit ideas. For each idea, provide a catchy title, a short description, and a list of product types that would complete the look.

User's Browsing History:
{{{browsingHistory}}}
`,
});

const generateOutfitSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateOutfitSuggestionsFlow',
    inputSchema: OutfitSuggestionsInputSchema,
    outputSchema: OutfitSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await stylistPrompt(input);
    return output!;
  }
);

export async function generateOutfitSuggestions(input: OutfitSuggestionsInput): Promise<OutfitSuggestionsOutput> {
  return await generateOutfitSuggestionsFlow(input);
}
