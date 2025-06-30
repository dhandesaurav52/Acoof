
"use client";

import { useState, useMemo, type ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/ProductCard';
import { ListFilter, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '@/hooks/use-products';
import { categories } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function ProductsPage() {
  const { products } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedColor, setSelectedColor] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');
  const [sortOption, setSortOption] = useState('default');

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const availableColors = useMemo(() => {
    const allColors = products.flatMap(p => p.colors || []);
    return ['All', ...Array.from(new Set(allColors))];
  }, [products]);

  const availableSizes = useMemo(() => {
    const allSizes = products.flatMap(p => p.sizes || []);
    return ['All', ...Array.from(new Set(allSizes))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products
      .filter(product => {
        // Category filter
        if (selectedCategory === 'All') return true;
        return product.category === selectedCategory;
      })
      .filter(product => {
        // Color filter
        if (selectedColor === 'All') return true;
        return product.colors?.includes(selectedColor);
      })
      .filter(product => {
        // Size filter
        if (selectedSize === 'All') return true;
        return product.sizes?.includes(selectedSize);
      })
      .filter(product => {
        // Search query filter
        if (!searchQuery) return true;
        const lowercasedQuery = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(lowercasedQuery) ||
          product.description.toLowerCase().includes(lowercasedQuery) ||
          product.category.toLowerCase().includes(lowercasedQuery)
        );
      });
      
    const sorted = [...filtered];

    switch (sortOption) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    return sorted;
  }, [searchQuery, products, selectedCategory, selectedColor, selectedSize, sortOption]);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">Our Collection</h1>
        <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
          Browse our curated selection of high-quality apparel and accessories.
        </p>
      </div>

      <div className="mb-12 flex flex-col gap-4 max-w-4xl mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedColor} onValueChange={setSelectedColor}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Colors" />
            </SelectTrigger>
            <SelectContent>
              {availableColors.map(color => (
                  <SelectItem key={color} value={color}>{color === 'All' ? 'All Colors' : color}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedSize} onValueChange={setSelectedSize}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Sizes" />
            </SelectTrigger>
            <SelectContent>
              {availableSizes.map(size => (
                  <SelectItem key={size} value={size}>{size === 'All' ? 'All Sizes' : size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto flex-shrink-0">
                      <ListFilter className="mr-2 h-4 w-4" />
                      Sort
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sortOption} onValueChange={setSortOption}>
                      <DropdownMenuRadioItem value="default">Default</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="price-asc">Price: Low to High</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="price-desc">Price: High to Low</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <p className="text-xl font-semibold">No Products Found</p>
            <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
