import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { Look } from "@/types";

interface OutfitCardProps {
  look: Look;
}

export function OutfitCard({ look }: OutfitCardProps) {
  return (
    <Card className="group relative w-full overflow-hidden rounded-lg">
      <div className="aspect-[4/5] w-full">
        <Image
          src={look.image}
          alt={look.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          data-ai-hint={look.aiHint}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <CardContent className="absolute bottom-0 w-full p-6">
        <h3 className="text-2xl font-bold text-white">{look.name}</h3>
      </CardContent>
    </Card>
  );
}
