import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { products } from '@/lib/data';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-secondary">
        <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline">
              Style Redefined
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              Discover the latest in urban fashion. Curated collections, timeless pieces, and your next favorite outfit await.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row justify-center md:justify-start">
              <Button asChild size="lg">
                <Link href="/products">Shop Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/lookbook">Explore Looks</Link>
              </Button>
            </div>
          </div>
          <div className="relative h-80 md:h-[450px] lg:h-[550px] w-full">
            <Image 
                src="https://placehold.co/800x1000.png"
                alt="Fashion model wearing urban attire"
                fill
                className="object-cover rounded-lg"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                data-ai-hint="fashion model"
            />
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl font-headline">New Arrivals</h2>
            <Button asChild variant="link" className="text-primary">
              <Link href="/products">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
