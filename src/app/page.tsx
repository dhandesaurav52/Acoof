
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shirt, ShoppingBag, Truck } from 'lucide-react';
import Image from 'next/image';
import { ProductCard } from '@/components/ProductCard';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useProducts } from '@/hooks/use-products';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { products, loading } = useProducts();
  
  const featuredStyles = [
    { name: 'Streetwear', image: 'https://firebasestorage.googleapis.com/v0/b/acoof-8e92d.firebasestorage.app/o/single1.png?alt=media&token=f9c6cf64-4659-4499-a3b3-a6b7b05f49ee', hint: 'man street style' },
    { name: 'Smart Casual', image: 'https://firebasestorage.googleapis.com/v0/b/acoof-8e92d.firebasestorage.app/o/single2.png?alt=media&token=5f916145-ab7f-4a08-be79-0994eb1b8361', hint: 'man smart casual' },
    { name: 'Night Life', image: 'https://placehold.co/600x750.png', hint: 'man night city' },
  ];
  
  const newArrivals = products.filter(p => p.isNew).slice(0, 8);

  const ProductSkeletons = () => (
    Array.from({ length: 4 }).map((_, index) => (
      <CarouselItem key={index} className="basis-1/2 md:basis-1/4">
        <div className="p-1 space-y-2">
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
        </div>
      </CarouselItem>
    ))
  );

  return (
    <div className="flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center">
        <div className="absolute inset-0">
            <Image 
                src="https://firebasestorage.googleapis.com/v0/b/acoof-8e92d.firebasestorage.app/o/homepage1.png?alt=media&token=ea898370-fc8f-4217-b550-1ee94ad49a40" 
                alt="Hero background" 
                fill
                className="object-cover object-center"
                priority
                quality={90}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent md:bg-gradient-to-r md:from-black/50 md:to-transparent" />
        </div>
        <div className="container relative mx-auto px-4 text-white">
          <div className="max-w-2xl text-left">
            <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl lg:text-7xl font-headline">
              Define Your Style
            </h1>
            <p className="mt-6 max-w-lg text-lg md:text-xl text-white/90">
              Discover curated collections of modern menswear. Quality essentials and timeless designs for the discerning individual.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="text-lg">
                <Link href="/products">Shop New Arrivals <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="flex flex-col items-center text-center p-8 bg-background/50">
              <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold font-headline">Exclusive Designs</h3>
              <p className="text-muted-foreground mt-2">Curated pieces you won't find anywhere else.</p>
            </Card>
            <Card className="flex flex-col items-center text-center p-8 bg-background/50">
              <Shirt className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold font-headline">Premium Quality</h3>
              <p className="text-muted-foreground mt-2">Crafted from the finest materials for lasting comfort.</p>
            </Card>
            <Card className="flex flex-col items-center text-center p-8 bg-background/50">
              <Truck className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold font-headline">Fast Shipping</h3>
              <p className="text-muted-foreground mt-2">Get your new look delivered to your door in days.</p>
            </Card>
          </div>
        </div>
      </section>
      
      {/* New Arrivals Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
           <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl font-headline">New Arrivals</h2>
            <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
              Fresh threads, just landed. Check out the latest additions to the Acoof collection.
            </p>
          </div>
          <Carousel
            opts={{
              align: "start",
              loop: newArrivals.length > 4,
            }}
            className="w-full"
          >
            <CarouselContent>
              {loading ? <ProductSkeletons /> : (
                newArrivals.map((product) => (
                  <CarouselItem key={product.id} className="basis-1/2 md:basis-1/4">
                    <div className="p-1">
                      <ProductCard product={product} />
                    </div>
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg">
              <Link href="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>


      {/* Shop by Style Section */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl font-headline">Shop by Style</h2>
            <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
              Your signature look is waiting. Find it in our curated style collections.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
            {featuredStyles.map((style) => (
              <Link href="/products" key={style.name} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg shadow-lg">
                  <Image
                    src={style.image}
                    alt={style.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    data-ai-hint={style.hint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="text-2xl font-bold text-white tracking-tight font-headline">{style.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Oversized T-shirts Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
            <div className="relative rounded-lg overflow-hidden bg-secondary p-8 md:p-16 flex items-center min-h-[400px] md:min-h-[500px]">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://placehold.co/1200x600.png"
                        alt="A man wearing a stylish oversized t-shirt"
                        fill
                        className="object-cover"
                        data-ai-hint="oversized t-shirt"
                        quality={80}
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </div>
                <div className="relative z-10 max-w-md text-white">
                    <h2 className="text-4xl font-bold tracking-tighter md:text-5xl font-headline">
                        The Perfect Drape
                    </h2>
                    <p className="mt-4 text-lg text-white/90">
                        Discover ultimate comfort and effortless style with our collection of oversized t-shirts. Designed for a relaxed fit and a modern silhouette.
                    </p>
                    <Button asChild size="lg" className="mt-8 text-lg">
                        <Link href="/products">
                            Shop Oversized Tees <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
}
