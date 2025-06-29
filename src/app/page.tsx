import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-secondary">
        <div className="container mx-auto flex flex-col items-center justify-center gap-12 px-4 py-24 text-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline">
              Let's Build Something New
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              This is your starting point. From here, we can create anything you can imagine.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <Button asChild size="lg">
                <Link href="/products">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Placeholder Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl font-headline">Features</h2>
            <Button asChild variant="link" className="text-primary">
              <Link href="#">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
             <div className="p-6 border rounded-lg bg-card">
                <h3 className="text-xl font-bold mb-2">Feature One</h3>
                <p className="text-muted-foreground">Description for the first feature goes here.</p>
            </div>
            <div className="p-6 border rounded-lg bg-card">
                <h3 className="text-xl font-bold mb-2">Feature Two</h3>
                <p className="text-muted-foreground">Description for the second feature goes here.</p>
            </div>
            <div className="p-6 border rounded-lg bg-card">
                <h3 className="text-xl font-bold mb-2">Feature Three</h3>
                <p className="text-muted-foreground">Description for the third feature goes here.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
