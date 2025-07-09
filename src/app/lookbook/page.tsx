
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { OutfitCard } from "@/components/OutfitCard";
import { looks, lookCategories } from "@/lib/data";
import type { LookCategory } from "@/types";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateOutfitImage } from '@/ai/flows/generate-outfit-image';


function AIStylist() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt) {
      toast({
        variant: 'destructive',
        title: 'Prompt is empty',
        description: 'Please describe the outfit you want to see.',
      });
      return;
    }
    setIsLoading(true);
    setGeneratedImage(null);
    try {
      const result = await generateOutfitImage({ prompt });
      if (result.imageUrl) {
        setGeneratedImage(result.imageUrl);
      } else {
        throw new Error('The AI did not return an image.');
      }
    } catch (error: any) {
      console.error('AI Stylist Error:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Sparkles className="mr-2 h-5 w-5" />
          AI Stylist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Outfit Stylist</DialogTitle>
          <DialogDescription>
            Describe an outfit, and our AI will generate an image of a model wearing it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="e.g., 'A model wearing a black leather jacket, a white t-shirt, dark wash slim-fit jeans, and brown chelsea boots.'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
          <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {isLoading ? 'Generating...' : 'Generate Image'}
          </Button>
          {generatedImage && (
            <div className="mt-4 border rounded-lg p-2">
              <h4 className="text-sm font-medium mb-2 text-center">Generated Outfit</h4>
              <div className="relative aspect-square">
                 <Image src={generatedImage} alt="AI generated outfit" fill className="object-cover rounded-md" />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
          Get inspired by our curated looks, or create your own with the AI Stylist.
        </p>
        <div className="mt-6">
          <AIStylist />
        </div>
      </div>

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
