
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { categories } from '@/lib/data';
import type { Product } from '@/types';

const ADMIN_EMAIL = "admin@example.com";

export default function OperateStorePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productCategory, setProductCategory] = useState<Product['category'] | ''>('');
    const [isNew, setIsNew] = useState(true);
    const [productImages, setProductImages] = useState<string[]>(['']);

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

    const handleImageChange = (index: number, value: string) => {
        const newImages = [...productImages];
        newImages[index] = value;
        setProductImages(newImages);
    };

    const addImageInput = () => {
        setProductImages([...productImages, '']);
    };

    const removeImageInput = (index: number) => {
        const newImages = productImages.filter((_, i) => i !== index);
        setProductImages(newImages);
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // In a real app, you'd send this data to a server action or API endpoint
        const finalImages = productImages.filter(img => img.trim() !== '');
        if (finalImages.length === 0) {
            finalImages.push('https://placehold.co/600x800.png');
        }
        
        console.log({
            name: productName,
            description: productDescription,
            price: parseFloat(productPrice),
            category: productCategory,
            isNew,
            images: finalImages,
            aiHint: productName.toLowerCase()
        });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
            title: "Product Added",
            description: `${productName} has been successfully added to the store.`,
        });

        // Reset form
        setProductName('');
        setProductDescription('');
        setProductPrice('');
        setProductCategory('');
        setIsNew(true);
        setProductImages(['']);
        setIsSubmitting(false);
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
                
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Product</CardTitle>
                            <CardDescription>Fill in the details for the new product below.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="product-name">Product Name</Label>
                                <Input id="product-name" value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g., Classic White Tee" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="product-description">Description</Label>
                                <Textarea id="product-description" value={productDescription} onChange={e => setProductDescription(e.target.value)} placeholder="A timeless staple for any wardrobe..." required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="product-price">Price ($)</Label>
                                    <Input id="product-price" type="number" value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="e.g., 25.00" required step="0.01" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-category">Category</Label>
                                    <Select value={productCategory} onValueChange={(value: Product['category']) => setProductCategory(value)} required>
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
                            <div className="space-y-2">
                                <Label>Image URLs</Label>
                                <div className="space-y-2">
                                    {productImages.map((image, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                id={`product-image-${index}`}
                                                value={image}
                                                onChange={(e) => handleImageChange(index, e.target.value)}
                                                placeholder="https://placehold.co/600x800.png"
                                            />
                                            {productImages.length > 1 ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeImageInput(index)}
                                                    className="flex-shrink-0"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    <span className="sr-only">Remove Image</span>
                                                </Button>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addImageInput} className="mt-2">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Another Image
                                </Button>
                                <p className="text-xs text-muted-foreground">The first image is the main display image. If all are blank, a placeholder is used.</p>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Switch id="is-new" checked={isNew} onCheckedChange={setIsNew} />
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
