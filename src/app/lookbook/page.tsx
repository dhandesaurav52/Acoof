
import { OutfitCard } from "@/components/OutfitCard";
import { looks, lookCategories } from "@/lib/data";
import type { LookCategory } from "@/types";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

const AiStylist = dynamic(
  () => import("@/components/AiStylist").then((mod) => mod.AiStylist),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full min-h-[500px] rounded-lg bg-secondary/50" />,
  }
);

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
          Get inspired by our curated looks or get a personalized style from our AI stylist.
        </p>
      </div>

      <div className="space-y-16">
        {/* AI Stylist Section */}
        <section>
          <AiStylist />
        </section>

        {/* Outfit Gallery Section */}
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
