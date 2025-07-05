
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
    <Card className="group/card overflow-hidden transition-shadow duration-300 hover:shadow-lg h-full flex flex-col">
       <CardHeader className="p-0">
        <Link href={`/products/${product.id}`} className="block relative group">
          <div className="aspect-[4/5] w-full overflow-hidden">
            <Image
              src={product.images[0] || 'https://placehold.co/600x800.png'}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          {product.isNew && (
            <Badge className="absolute left-3 top-3">NEW</Badge>
          )}
           <Button 
            variant="secondary" 
            size="icon" 
            className="absolute right-3 top-3 h-9 w-9 rounded-full bg-background/60 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            onClick={handleFavoriteClick}
            aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
           >
              <Heart className={cn("h-5 w-5", isFavorited && "fill-primary text-primary")} />
           </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Badge variant="secondary" className="mb-2">{product.category}</Badge>
        <CardTitle className="text-lg font-bold leading-tight">
           <Link href={`/products/${product.id}`} className="hover:underline">
            {product.name}
          </Link>
        </CardTitle>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <p className="text-xl font-semibold text-primary">₹{product.price.toFixed(2)}</p>
        <Button onClick={handleAddToCartClick} size="sm" className="opacity-0 group-hover/card:opacity-100 transition-opacity">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add
        </Button>
      </CardFooter>
    </Card>
  );
};

export const ProductCard = React.memo(ProductCardComponent);
