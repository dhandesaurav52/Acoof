
'use client';

import { useState } from 'react';
import { OutfitCard } from "@/components/OutfitCard";
import { looks, lookCategories } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { generateOutfitImage } from '@/ai/flows/generate-outfit-image';

function AiStylist() {
  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const result = await generateOutfitImage({ prompt });
      setGeneratedImageUrl(result.imageUrl);
    } catch (err: any) {
      console.error(err);
      let friendlyError = err.message || 'An unknown error occurred while generating the image.';
      if (friendlyError.includes('API key not valid')) {
        friendlyError = 'The provided API key is not valid. Please check your .env file.';
      } else if (friendlyError.includes('feature is not configured')) {
        friendlyError = 'The AI feature is not configured on the server. The GOOGLE_API_KEY may be missing.';
      }
      setError(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-16">
      <CardHeader>
        <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <Wand2 className="h-8 w-8 text-primary" />
            AI Stylist
        </CardTitle>
        <CardDescription>
            Describe an outfit, and our AI will generate an image of it for you. Be as descriptive as you like!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                    placeholder="e.g., A model wearing a black leather jacket, white t-shirt, dark wash jeans, and brown chelsea boots, walking down a city street."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                    disabled={isLoading}
                />
                <Button type="submit" className="w-full" disabled={isLoading || !prompt.trim()}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        "Generate Outfit"
                    )}
                </Button>
            </form>
            <div className="relative aspect-square border border-dashed rounded-lg flex items-center justify-center bg-muted/50 p-4">
                {isLoading && (
                    <div className="space-y-2 flex flex-col items-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground">Generating your masterpiece...</p>
                    </div>
                )}
                {!isLoading && !generatedImageUrl && !error && (
                    <p className="text-muted-foreground text-center p-4">Your generated image will appear here.</p>
                )}
                {generatedImageUrl && (
                    <Image
                        src={generatedImageUrl}
                        alt="AI generated outfit"
                        fill
                        className="object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                )}
                {error && (
                    <div className="text-destructive text-center p-4 flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8" />
                        <p className="font-semibold">Generation Failed</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function LookbookPage() {
  const looksByCategory = lookCategories.map(category => ({
    category,
    looks: looks.filter(look => look.category === category)
  })).filter(group => group.looks.length > 0);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">The Lookbook</h1>
        <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
          Use our AI Stylist to visualize your perfect outfit, or get inspired by our curated looks below.
        </p>
      </div>
      
      <AiStylist />

      <div className="space-y-16">
        <section>
          <div className="space-y-12">
            {looksByCategory.map(({ category, looks }) => (
              <div key={category}>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl font-headline mb-8 text-center">
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {looks.map((look) => (
                    <OutfitCard key={look.id} look={look} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
