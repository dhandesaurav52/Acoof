
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { categories } from '@/lib/data';
import type { Product } from '@/types';
import { addProduct as addProductAction } from '@/app/actions';
import { useProducts } from '@/hooks/use-products';

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
    const [isNew, setIsNew] = useState(true);
    const [productImageFiles, setProductImageFiles] = useState<File[]>([]);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setProductImageFiles(Array.from(e.target.files));
        }
    };

    const removeFile = (index: number) => {
        const newFiles = productImageFiles.filter((_, i) => i !== index);
        setProductImageFiles(newFiles);
        // Also clear the file input
        const dt = new DataTransfer();
        newFiles.forEach(file => dt.items.add(file));
        const fileInput = formRef.current?.elements.namedItem('images') as HTMLInputElement;
        if (fileInput) {
          fileInput.files = dt.files;
        }
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        
        const result = await addProductAction(formData);

        if (result.error) {
            toast({
                variant: "destructive",
                title: "Failed to Add Product",
                description: result.error,
            });
        } else if (result.success && result.product) {
            addProduct(result.product);
            toast({
                title: "Product Added",
                description: `${result.product.name} has been successfully added to the store.`,
            });
            // Reset form
            formRef.current?.reset();
            setProductName('');
            setProductDescription('');
            setProductPrice('');
            setProductCategory('');
            setIsNew(true);
            setProductImageFiles([]);
        }
        
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
                            <div className="space-y-2">
                                <Label htmlFor="product-images">Product Images</Label>
                                <Input 
                                    id="product-images"
                                    name="images"
                                    type="file"
                                    multiple
                                    accept="image/png, image/jpeg"
                                    onChange={handleFileChange}
                                    className="file:text-primary file:font-medium"
                                />
                                <p className="text-xs text-muted-foreground">You can select multiple images. If none are selected, a placeholder will be used.</p>
                                
                                {productImageFiles.length > 0 && (
                                    <div className="mt-4 space-y-2 border rounded-md p-3">
                                        <p className="text-sm font-medium">Selected files:</p>
                                        <ul className="space-y-2">
                                            {productImageFiles.map((file, index) => (
                                                <li key={index} className="flex items-center justify-between text-sm text-muted-foreground bg-secondary/50 p-2 rounded-md">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <FileImage className="h-4 w-4 flex-shrink-0" />
                                                        <span className="truncate">{file.name}</span>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)} className="h-6 w-6 flex-shrink-0">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                        <span className="sr-only">Remove {file.name}</span>
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
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
