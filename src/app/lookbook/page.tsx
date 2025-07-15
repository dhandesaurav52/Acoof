
'use client';

import { lookCategories, looks } from "@/lib/data";
import { OutfitCard } from '@/components/OutfitCard';

export default function LookbookPage() {
  
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">The Lookbook</h2>
        <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
          Get inspired by our curated looks from the world of modern menswear.
        </p>
      </div>

      <div className="space-y-16">
        {lookCategories.map(category => (
          <section key={category}>
            <h3 className="text-3xl font-bold tracking-tighter md:text-4xl font-headline mb-8 text-center">
              {category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {looks
                .filter(look => look.category === category)
                .map((look) => (
                  <OutfitCard key={look.id} look={look} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
