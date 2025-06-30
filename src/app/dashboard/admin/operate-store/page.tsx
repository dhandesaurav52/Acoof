
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { categories } from '@/lib/data';
import type { Product } from '@/types';

const ADMIN_EMAIL = "admin@example.com";

export default function OperateStorePage() {
    const { user, loading } = useAuth();
    const { addProduct } = useProducts();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    // Form state
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productCategory, setProductCategory] = useState<Product['category'] | ''>('');
    const [productColors, setProductColors] = useState('');
    const [productSizes, setProductSizes] = useState('');
    const [isNew, setIsNew] = useState(true);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/login');
        } else if (user.email !== ADMIN_EMAIL) {
            router.push('/dashboard/user');
        }
    }, [user, loading, router]);
    
    if (loading || !user || user.email !== ADMIN_EMAIL) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          if (file.size > 4 * 1024 * 1024) { // 4MB limit
            toast({
              variant: 'destructive',
              title: 'Image too large',
              description: 'Please select an image smaller than 4MB.',
            });
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const price = parseFloat(productPrice);
        if (isNaN(price)) {
            toast({
                variant: "destructive",
                title: "Invalid Price",
                description: "Please enter a valid number for the price.",
            });
            setIsSubmitting(false);
            return;
        }

        const newProductData: Omit<Product, 'id'> = {
            name: productName,
            description: productDescription,
            price: price,
            category: productCategory as Product['category'],
            isNew: isNew,
            images: imagePreview ? [imagePreview] : ['https://placehold.co/600x800.png'],
            aiHint: productName.toLowerCase(),
            colors: productColors ? productColors.split(',').map(s => s.trim()).filter(Boolean) : [],
            sizes: productSizes ? productSizes.split(',').map(s => s.trim()).filter(Boolean) : [],
        };
        
        try {
            addProduct(newProductData);

            toast({
                title: "Product Added",
                description: `${newProductData.name} has been successfully added to the store.`,
            });

            // Reset form
            formRef.current?.reset();
            setProductName('');
            setProductDescription('');
            setProductPrice('');
            setProductCategory('');
            setProductColors('');
            setProductSizes('');
            setIsNew(true);
            setImagePreview(null);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to Add Product",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-left mb-8">
                    <h1 className="text-4xl font-bold tracking-tighter font-headline">Operate Store</h1>
                    <p className="text-muted-foreground mt-2">
                        Add new products to your collection.
                    </p>
                </div>
                
                <form ref={formRef} onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Product</CardTitle>
                            <CardDescription>Fill in the details for the new product below.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="product-name">Product Name</Label>
                                <Input id="product-name" name="productName" value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g., Classic White Tee" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="product-description">Description</Label>
                                <Textarea id="product-description" name="productDescription" value={productDescription} onChange={e => setProductDescription(e.target.value)} placeholder="A timeless staple for any wardrobe..." required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="product-price">Price ($)</Label>
                                    <Input id="product-price" name="productPrice" type="number" value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="e.g., 25.00" required step="0.01" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-category">Category</Label>
                                    <Select name="productCategory" value={productCategory} onValueChange={(value: Product['category']) => setProductCategory(value)} required>
                                        <SelectTrigger id="product-category">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="product-colors">Colors</Label>
                                    <Input id="product-colors" name="productColors" value={productColors} onChange={e => setProductColors(e.target.value)} placeholder="e.g., Red, Blue, Green" />
                                    <p className="text-xs text-muted-foreground">Comma-separated values.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-sizes">Sizes</Label>
                                    <Input id="product-sizes" name="productSizes" value={productSizes} onChange={e => setProductSizes(e.target.value)} placeholder="e.g., S, M, L, XL" />
                                     <p className="text-xs text-muted-foreground">Comma-separated values.</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="product-image">Product Image</Label>
                                <Input
                                    id="product-image"
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={handleImageChange}
                                    className="file:text-foreground"
                                />
                                <p className="text-xs text-muted-foreground">Max file size: 4MB.</p>
                                {imagePreview ? (
                                    <div className="mt-4 relative aspect-[4/5] w-full max-w-xs mx-auto">
                                        <p className="text-sm font-medium mb-2 text-center">Image Preview:</p>
                                        <Image
                                            src={imagePreview}
                                            alt="Product image preview"
                                            fill
                                            className="rounded-md object-cover border"
                                        />
                                    </div>
                                ) : (
                                    <div className="mt-4 p-4 border-2 border-dashed rounded-md text-center text-muted-foreground bg-secondary/30">
                                        <FileImage className="mx-auto h-8 w-8 mb-2" />
                                        <p className="text-sm">No image selected.</p>
                                        <p className="text-xs">If no image is chosen, a placeholder will be used.</p>
                                    </div>
                                )}
                            </div>
                             <div className="flex items-center space-x-2">
                                <Switch name="isNew" id="is-new" checked={isNew} onCheckedChange={setIsNew} />
                                <Label htmlFor="is-new">Mark as New Arrival</Label>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                )}
                                Add Product
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </div>
    );
}
