
'use client';

import { useEffect, useState, useMemo, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useProducts } from '@/hooks/use-products';
import type { Product } from '@/types';
import { Loader2, Trash2, Search, ListFilter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { categories } from '@/lib/data';


const ADMIN_EMAIL = "admin@example.com";

export default function OperateStorePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { products, loading: productsLoading, removeProduct } = useProducts();
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
        .filter(product => selectedCategory === 'All' || product.category === selectedCategory)
        .filter(product => selectedColor === 'All' || product.colors?.includes(selectedColor))
        .filter(product => selectedSize === 'All' || product.sizes?.includes(selectedSize))
        .filter(product => {
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
        case 'name-asc':
          sorted.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name-desc':
          sorted.sort((a, b) => b.name.localeCompare(a.name));
          break;
        default:
          break;
      }
  
      return sorted;
    }, [searchQuery, products, selectedCategory, selectedColor, selectedSize, sortOption]);

    useEffect(() => {
        if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || productsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);

        try {
            await removeProduct(productToDelete);
            toast({ title: "Product Removed", description: `"${productToDelete.name}" has been removed from the store.` });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Removal Failed',
                description: "Could not remove product. Please check console for details.",
            });
            console.error("Failed to remove product:", error);
        } finally {
            setIsDeleting(false);
            setProductToDelete(null);
        }
    };

    return (
        <div className="container mx-auto py-12 px-4">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Products</CardTitle>
                    <CardDescription>View, edit, and remove products from your store.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="mb-8 flex flex-col gap-4">
                        <div className="relative w-full">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Search products by name, ID, category..."
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
                                      <DropdownMenuRadioItem value="name-asc">Name: A to Z</DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="name-desc">Name: Z to A</DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="price-asc">Price: Low to High</DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="price-desc">Price: High to Low</DropdownMenuRadioItem>
                                  </DropdownMenuRadioGroup>
                              </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <Image
                                                src={product.images[0] || 'https://placehold.co/64x64.png'}
                                                alt={product.name}
                                                width={64}
                                                height={64}
                                                className="rounded-md object-cover"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{product.name}</div>
                                            <div className="text-xs text-muted-foreground">{product.id}</div>
                                        </TableCell>
                                        <TableCell>{product.category}</TableCell>
                                        <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => setProductToDelete(product)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">No products found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!productToDelete} onOpenChange={(open) => { if (!open) setProductToDelete(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product <span className="font-semibold">"{productToDelete?.name}"</span> and all of its associated images from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setProductToDelete(null)} disabled={isDeleting}>Back</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleConfirmDelete} 
                            disabled={isDeleting} 
                            className={buttonVariants({ variant: "destructive" })}
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isDeleting ? "Deleting..." : "Confirm Deletion"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
