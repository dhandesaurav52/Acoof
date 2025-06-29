import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <CardHeader className="p-0">
        <div className="relative aspect-[3/4] w-full">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint={product.aiHint}
          />
          {product.isNew && (
            <Badge className="absolute right-3 top-3" variant="default">NEW</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="text-lg font-medium leading-tight">
          <Link href={`/products#${product.id}`} className="focus:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            {product.name}
          </Link>
        </CardTitle>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <p className="text-lg font-semibold text-primary">${product.price.toFixed(2)}</p>
      </CardFooter>
    </Card>
  );
}
