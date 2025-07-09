'use client';

import { useState } from 'react';
import { Wand2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAiSuggestions } from '@/app/actions';
import { useProducts } from '@/hooks/use-products';
import { Badge } from './ui/badge';
import type { OutfitSuggestionsOutput } from '@/ai/flows/generate-outfit-suggestions';

export function AiStylist() {
  const { products } = useProducts();
  const [suggestions, setSuggestions] = useState<OutfitSuggestionsOutput['suggestions']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    // Create a simple browsing history from the available products for the demo
    const browsingHistory = "User has shown interest in classic and casual wear, including: " + 
                            products.slice(0, 5).map(p => p.name).join(', ') + ".";
    
    const result = await getAiSuggestions(browsingHistory);

    if (result.error) {
      setError(result.error);
    } else {
      setSuggestions(result.suggestions);
    }
    setIsLoading(false);
  };

  return (
    <section>
      <Card className="bg-secondary/50 border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
            <Wand2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tighter font-headline">AI Personal Stylist</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Can't decide what to wear? Let our AI generate some personalized outfit ideas for you based on our latest collection.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button size="lg" onClick={handleGetSuggestions} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              'Get Style Suggestions'
            )}
          </Button>

          {error && (
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive/50 text-destructive rounded-lg flex items-center gap-3 max-w-2xl mx-auto">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm text-left">{error}</p>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {suggestions.map((suggestion, index) => (
                <Card key={index} className="bg-background">
                  <CardHeader>
                    <CardTitle>{suggestion.title}</CardTitle>
                    <CardDescription>{suggestion.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold mb-2 text-sm">Outfit Includes:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestion.products.map((product, i) => (
                            <Badge key={i} variant="outline">{product}</Badge>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
