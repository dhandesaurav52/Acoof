
"use client";

import { useState } from "react";
import Image from "next/image";
import { Wand2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAiSuggestions } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/use-products";
import { Skeleton } from "@/components/ui/skeleton";

interface Suggestion {
  description: string;
  imageUrl: string;
}

export function AiStylist() {
  const { products } = useProducts();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateSuggestions = async () => {
    setIsLoading(true);
    setSuggestions([]);

    // Simulate browsing history by picking some products
    const browsingHistory = products
      .slice(0, 3)
      .map((p) => `${p.name} (${p.category})`)
      .join(", ");

    const { suggestions: newSuggestions, error } = await getAiSuggestions(browsingHistory);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
    } else {
      setSuggestions(newSuggestions);
    }
    setIsLoading(false);
  };

  const LoadingSkeletons = () => (
     <div className="space-y-4">
        <h3 className="text-xl font-semibold">Generating your looks...</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden bg-background">
                    <Skeleton className="aspect-[4/5] w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );

  return (
    <Card className="bg-secondary/50">
      <CardHeader>
        <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle className="text-2xl">AI Personal Stylist</CardTitle>
                <CardDescription>Get outfit ideas based on your style, complete with generated images.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <p className="text-muted-foreground">
            Let our AI stylist create unique looks for you. We'll use a sample of your interests to generate personalized outfit recommendations. This may take up to 30 seconds.
          </p>
          <Button onClick={handleGenerateSuggestions} disabled={isLoading} className="w-full sm:w-auto self-start">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get Style Advice
              </>
            )}
          </Button>

          {isLoading && <LoadingSkeletons />}

          {!isLoading && suggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Your Personalized Lookbook:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="overflow-hidden bg-background group">
                    <div className="relative aspect-[4/5] w-full">
                      <Image
                        src={suggestion.imageUrl}
                        alt={`AI-generated look for: ${suggestion.description}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
