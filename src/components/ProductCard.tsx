
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types";
import { Button } from "./ui/button";
import { ShoppingCart, Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import React from "react";

interface ProductCardProps {
  product: Product;
}

const ProductCardComponent = ({ product }: ProductCardProps) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isFavorited = isInWishlist(product.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent card click
    if (isFavorited) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg bg-card border-border group">
      <CardHeader className="p-0">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-lg">
          <Image
            src={product.images[0] || 'https://placehold.co/600x800.png'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {product.isNew && (
            <Badge className="absolute left-3 top-3" variant="default">NEW</Badge>
          )}
           <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-background/50 text-foreground hover:bg-background/75"
            onClick={handleFavoriteClick}
            aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
           >
              <Heart className={cn("h-5 w-5", isFavorited && "fill-primary text-primary")} />
           </Button>
           <Link href={`/products/${product.id}`} className="absolute inset-0" aria-label={product.name} />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-3">
        <CardTitle className="text-sm font-semibold leading-snug">
          <Link href={`/products/${product.id}`} className="focus:outline-none">
            <span className="absolute inset-0"></span>
            {product.name}
          </Link>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1 truncate">{product.category}</p>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        <p className="text-base font-bold text-primary">₹{product.price.toFixed(2)}</p>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleAddToCartClick}>
          <ShoppingCart className="h-4 w-4" />
          <span className="sr-only">Add to Cart</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export const ProductCard = React.memo(ProductCardComponent);
