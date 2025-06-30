
"use client";

import { useState } from "react";
import { Wand2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAiSuggestions } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/use-products";

export function AiStylist() {
  const { products } = useProducts();
  const [suggestions, setSuggestions] = useState<string[]>([]);
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

  return (
    <Card className="bg-secondary/50">
      <CardHeader>
        <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle className="text-2xl">AI Personal Stylist</CardTitle>
                <CardDescription>Get outfit ideas based on your style.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <p className="text-muted-foreground">
            Let our AI stylist create unique looks for you. We'll use a sample of your interests to generate personalized outfit recommendations.
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

          {suggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Your Personalized Lookbook:</h3>
              <ul className="list-disc space-y-3 rounded-lg border bg-background p-6 pl-12">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="text-foreground/80">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
