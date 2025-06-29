import { OutfitCard } from "@/components/OutfitCard";
import { AiStylist } from "@/components/AiStylist";
import { looks } from "@/lib/data";

export default function LookbookPage() {
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
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl font-headline mb-8 text-center">
            Shop The Looks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {looks.map((look) => (
              <OutfitCard key={look.id} look={look} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
