
'use client';

import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { looks, lookCategories } from "@/lib/data";
import { OutfitCard } from '@/components/OutfitCard';
import { Sparkles, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const AiStylist = dynamic(() => import('@/components/AiStylist').then(mod => mod.AiStylist), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
});


export default function LookbookPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const looksByCategory = lookCategories.map(category => ({
    category,
    looks: looks.filter(look => look.category === category)
  })).filter(group => group.looks.length > 0);
  
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Stylist
        </h1>
        <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
          Take a clear, well-lit photo of yourself, and our AI will generate new outfits for you to try on.
        </p>
      </div>

      {isMounted ? <AiStylist /> : <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}

      <Separator className="my-16" />

      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">The Lookbook</h2>
        <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
          Get inspired by our curated looks from the world of modern menswear.
        </p>
      </div>

      <div className="space-y-16">
        <section>
          <div className="space-y-12">
            {looksByCategory.map(({ category, looks }) => (
              <div key={category}>
                <h3 className="text-3xl font-bold tracking-tighter md:text-4xl font-headline mb-8 text-center">
                  {category}
                </h3>
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
