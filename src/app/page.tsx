
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const featuredStyles = [
    { name: 'HipHop', image: 'https://placehold.co/400x400.png', aiHint: 'hiphop fashion' },
    { name: 'Casual', image: 'https://placehold.co/400x400.png', aiHint: 'casual fashion' },
    { name: 'Party Wear', image: 'https://placehold.co/400x400.png', aiHint: 'party fashion' },
    { name: 'Shoes', image: 'https://placehold.co/400x400.png', aiHint: 'stylish shoes' },
    { name: 'Socks', image: 'https://placehold.co/400x400.png', aiHint: 'colorful socks' },
    { name: 'Bags', image: 'https://placehold.co/400x400.png', aiHint: 'fashion bag' },
    { name: 'Wallet', image: 'https://placehold.co/400x400.png', aiHint: 'leather wallet' },
    { name: 'T-Shirts', image: 'https://placehold.co/400x400.png', aiHint: 'graphic t-shirt' },
    { name: 'Shirts', image: 'https://placehold.co/400x400.png', aiHint: 'dress shirt' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-secondary h-[80vh] flex items-center justify-center">
        <div className="absolute inset-0">
            <Image 
                src="https://placehold.co/1920x1080.png" 
                alt="Hero background" 
                fill
                className="object-cover"
                priority
                data-ai-hint="fashion clothes"
            />
            <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="container relative mx-auto flex flex-col items-center justify-center gap-12 px-4 text-center text-white">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline">
              Style Redefined.
            </h1>
            <p className="max-w-[600px] text-lg md:text-xl">
              Discover curated collections and find your unique look with Acoof.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <Button asChild size="lg">
                <Link href="/products">Shop Now</Link>
              </Button>
               <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black">
                <Link href="/lookbook">Explore Lookbook</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Style Section */}
      <section className="py-16 md:py-24">
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
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={style.image}
                    alt={style.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={style.aiHint}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="text-2xl font-bold text-white tracking-tight">{style.name}</h3>
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
