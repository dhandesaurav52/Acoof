
"use client";

import { useState, useMemo, type ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { products, categories } from '@/lib/data';
import { Search, X } from 'lucide-react';
import type { Product } from '@/types';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Product['category'] | null>(null);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredProducts = useMemo(() => {
    let filtered: Product[] = [...products];

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(lowercasedQuery) ||
        p.description.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    return filtered;
  }, [searchQuery, selectedCategory]);
  
  const handleClearFilters = () => {
      setSearchQuery('');
      setSelectedCategory(null);
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">Our Collection</h1>
        <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
          Browse our curated selection of high-quality apparel and accessories.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Filters */}
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <div className="sticky top-20 space-y-8">
            <h2 className="text-xl font-semibold">Filters</h2>
            <div className="space-y-6">
              {/* Search */}
              <div>
                <label htmlFor="search" className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-medium mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                      size="sm"
                      className="rounded-full"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {(searchQuery || selectedCategory) && (
                  <div>
                      <Button variant="ghost" onClick={handleClearFilters} className="text-sm text-muted-foreground hover:text-primary px-0">
                          <X className="w-4 h-4 mr-2" />
                          Clear Filters
                      </Button>
                  </div>
              )}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full min-h-[40vh] rounded-lg border border-dashed">
                <p className="text-xl font-semibold">No Products Found</p>
                <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
