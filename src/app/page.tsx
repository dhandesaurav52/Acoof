
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shirt, ShoppingBag, Truck } from 'lucide-react';
import Image from 'next/image';
import { ProductCard } from '@/components/ProductCard';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useProducts } from '@/hooks/use-products';

export default function Home() {
  const { products } = useProducts();
  
  const featuredStyles = [
    { name: 'Streetwear', image: 'https://images.pexels.com/photos/1040173/pexels-photo-1040173.jpeg' },
    { name: 'Smart Casual', image: 'https://images.pexels.com/photos/842811/pexels-photo-842811.jpeg' },
    { name: 'Night Life', image: 'https://images.pexels.com/photos/1102874/pexels-photo-1102874.jpeg' },
  ];
  
  const newArrivals = products.filter(p => p.isNew).slice(0, 8);

  return (
    <div className="flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center">
        <div className="absolute inset-0">
            <Image 
                src="https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg" 
                alt="Hero background" 
                fill
                className="object-cover object-center"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
        </div>
        <div className="container relative mx-auto px-4 text-white">
          <div className="max-w-2xl text-left">
            <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl lg:text-7xl font-headline">
              Style Is A Way To Say Who You Are
            </h1>
            <p className="mt-6 max-w-lg text-lg md:text-xl text-foreground/80">
              Forget trends. We deal in timeless threads and iconic looks. Find your uniform with Acoof.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="text-lg">
                <Link href="/products">Shop The Collection <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
               <Button asChild size="lg" variant="link" className="text-lg text-white">
                <Link href="/lookbook">Explore Lookbook</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold font-headline">Exclusive Designs</h3>
              <p className="text-muted-foreground mt-2">Curated pieces you won't find anywhere else.</p>
            </div>
            <div className="flex flex-col items-center">
              <Shirt className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold font-headline">Premium Quality</h3>
              <p className="text-muted-foreground mt-2">Crafted from the finest materials for lasting comfort.</p>
            </div>
            <div className="flex flex-col items-center">
              <Truck className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold font-headline">Fast Shipping</h3>
              <p className="text-muted-foreground mt-2">Get your new look delivered to your door in days.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* New Arrivals Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
           <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl font-headline">New Arrivals</h2>
            <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
              Check out the latest additions to our collection.
            </p>
          </div>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {newArrivals.map((product) => (
                <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <div className="p-1">
                    <ProductCard product={product} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
          <div className="text-center mt-12">
            <Button asChild variant="outline">
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
              Find your look from our curated styles.
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
    </div>
  );
}
