
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
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

      {/* Featured Products Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl font-headline">Featured Products</h2>
            <Button asChild variant="link" className="text-primary">
              <Link href="/products">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
             <div className="p-6 border rounded-lg bg-card text-center">
                <Image src="https://placehold.co/400x400.png" alt="Product 1" width={400} height={400} className="w-full h-auto rounded-md mb-4" data-ai-hint="tshirt fashion"/>
                <h3 className="text-xl font-bold mb-2">Product One</h3>
                <p className="text-muted-foreground">$49.99</p>
            </div>
            <div className="p-6 border rounded-lg bg-card text-center">
                <Image src="https://placehold.co/400x400.png" alt="Product 2" width={400} height={400} className="w-full h-auto rounded-md mb-4" data-ai-hint="jeans fashion"/>
                <h3 className="text-xl font-bold mb-2">Product Two</h3>
                <p className="text-muted-foreground">$89.99</p>
            </div>
            <div className="p-6 border rounded-lg bg-card text-center">
                <Image src="https://placehold.co/400x400.png" alt="Product 3" width={400} height={400} className="w-full h-auto rounded-md mb-4" data-ai-hint="sneakers fashion"/>
                <h3 className="text-xl font-bold mb-2">Product Three</h3>
                <p className="text-muted-foreground">$129.99</p>
            </div>
            <div className="p-6 border rounded-lg bg-card text-center">
                <Image src="https://placehold.co/400x400.png" alt="Product 4" width={400} height={400} className="w-full h-auto rounded-md mb-4" data-ai-hint="jacket fashion"/>
                <h3 className="text-xl font-bold mb-2">Product Four</h3>
                <p className="text-muted-foreground">$199.99</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
