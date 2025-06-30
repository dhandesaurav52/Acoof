import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types";
import { Button } from "./ui/button";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 bg-secondary border-secondary">
      <CardHeader className="p-0">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-lg">
          <Image
            src={product.images[0] || 'https://placehold.co/600x800.png'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint={product.aiHint}
          />
          {product.isNew && (
            <Badge className="absolute right-3 top-3" variant="default">NEW</Badge>
          )}
           <Link href={`/products#${product.id}`} className="absolute inset-0" aria-label={product.name} />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="text-base font-medium leading-tight">
          <Link href={`/products#${product.id}`} className="focus:outline-none">
            {product.name}
          </Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p className="text-lg font-semibold text-primary">${product.price.toFixed(2)}</p>
        <Button variant="outline" size="icon">
          <ShoppingCart className="h-4 w-4" />
          <span className="sr-only">Add to Cart</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
