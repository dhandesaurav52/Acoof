
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, FileImage, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { categories } from '@/lib/data';
import type { Product } from '@/types';
import { database, storage, auth } from '@/lib/firebase';
import { ref as dbRef, set, push, child } from "firebase/database";
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { Badge } from '@/components/ui/badge';

const ADMIN_EMAIL = "admin@example.com";

export default function OperateStorePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    // Form state
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productCategory, setProductCategory] = useState<Product['category'] | ''>('');
    const [productColors, setProductColors] = useState<string[]>([]);
    const [productSizes, setProductSizes] = useState<string[]>([]);
    const [currentColor, setCurrentColor] = useState('');
    const [currentSize, setCurrentSize] = useState('');
    const [isNew, setIsNew] = useState(true);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/login');
        } else if (user.email !== ADMIN_EMAIL) {
            router.push('/dashboard/user');
        }
    }, [user, loading, router]);
    
    const handleAddColor = () => {
        const trimmedColor = currentColor.trim();
        if (trimmedColor && !productColors.includes(trimmedColor)) {
            setProductColors([...productColors, trimmedColor]);
        }
        setCurrentColor('');
    };

    const handleColorInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddColor();
        }
    };
    
    const handleRemoveColor = (colorToRemove: string) => {
        setProductColors(productColors.filter(color => color !== colorToRemove));
    };

    const handleAddSize = () => {
        const trimmedSize = currentSize.trim().toUpperCase();
        if (trimmedSize && !productSizes.includes(trimmedSize)) {
            setProductSizes([...productSizes, trimmedSize]);
        }
        setCurrentSize('');
    };

    const handleSizeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSize();
        }
    };

    const handleRemoveSize = (sizeToRemove: string) => {
        setProductSizes(productSizes.filter(size => size !== sizeToRemove));
    };

    const addProduct = async (productData: Omit<Product, 'id'>) => {
        if (!auth?.currentUser) {
            toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'You are not logged in. Please log in again and retry.',
            });
            setIsSubmitting(false);
            return;
        }

        if (!database || !storage) {
            toast({ variant: "destructive", title: "Firebase Not Configured", description: 'Cannot add product.' });
            setIsSubmitting(false);
            return;
        }
        
        if (!productData.name || !productData.price || !productData.category) {
            toast({ variant: "destructive", title: "Validation Error", description: 'Missing required product fields: name, price, or category.' });
            setIsSubmitting(false);
            return;
        }

        try {
            let imageUrls: string[] = [];
            
            if (productData.images && productData.images.length > 0 && productData.images[0].startsWith('data:')) {
                const uploadPromises = productData.images.map(async (imgDataUri, index) => {
                    const newIdForImage = push(child(dbRef(database), 'products')).key || `image_${Date.now()}`;
                    const fileExtensionMatch = imgDataUri.match(/data:image\/(.+);base64,/);
                    const fileExtension = fileExtensionMatch ? fileExtensionMatch[1] : 'png';
                    const imageFileName = `${newIdForImage}_${index}.${fileExtension}`;
                    const imageStorageRef = storageRef(storage, `products/${imageFileName}`);
                    
                    try {
                        const snapshot = await uploadString(imageStorageRef, imgDataUri, 'data_url');
                        return getDownloadURL(snapshot.ref);
                    } catch (uploadError: any) {
                        console.error(`Failed to upload image ${index}:`, uploadError);
                        // Re-throw the specific error to be caught by the outer catch block
                        throw uploadError;
                    }
                });

                imageUrls = await Promise.all(uploadPromises);

            } else {
                imageUrls = productData.images?.length > 0 ? productData.images : ['https://placehold.co/600x800.png'];
            }

            const newProductRef = push(dbRef(database, 'products'));
            const newId = newProductRef.key;
            if (!newId) {
                 throw new Error('Failed to generate a new product ID from Firebase.');
            }

            const productToSave: Product = {
                ...productData,
                id: newId,
                images: imageUrls,
            };

            await set(newProductRef, productToSave);

            toast({
                title: "Product Added",
                description: `Successfully added product: ${productToSave.name}`
            });
            resetForm();

        } catch (error: any) {
            console.error('Failed to add product:', error);
            let errorMessage = error.message || 'An unknown error occurred while adding the product.';
            if (error.code === 'storage/unauthorized') {
                errorMessage = "Permission denied for Firebase Storage. Please double-check your Storage security rules to allow writes for authenticated users.";
            } else if (error.code === 'database/permission-denied') {
                errorMessage = "Permission denied for Firebase Realtime Database. Please check your Database security rules.";
            }
            
            toast({
                variant: "destructive",
                title: "Failed to Add Product",
                description: errorMessage,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !user || user.email !== ADMIN_EMAIL) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) {
            setImagePreviews([]);
            return;
        }

        const fileReadPromises: Promise<string>[] = [];

        for (const file of Array.from(files)) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                toast({
                    variant: 'destructive',
                    title: 'Image too large',
                    description: `${file.name} is larger than 4MB and will not be included.`,
                });
                continue; // Skip this file
            }

            const promise = new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            fileReadPromises.push(promise);
        }

        try {
            const results = await Promise.all(fileReadPromises);
            setImagePreviews(results);
        } catch (error) {
            console.error("Error reading one or more files:", error);
            toast({
                variant: 'destructive',
                title: 'File Read Error',
                description: 'Could not read one of the selected image files.',
            });
        }
    };

    const resetForm = () => {
        formRef.current?.reset();
        setProductName('');
        setProductDescription('');
        setProductPrice('');
        setProductCategory('');
        setProductColors([]);
        setProductSizes([]);
        setCurrentColor('');
        setCurrentSize('');
        setIsNew(true);
        setImagePreviews([]);
    };

    const handleCancel = () => {
        resetForm();
        toast({
            title: "Form Cleared",
            description: "The new product form has been reset.",
        });
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
            images: imagePreviews.length > 0 ? imagePreviews : ['https://placehold.co/600x800.png'],
            aiHint: productName.toLowerCase(),
            colors: productColors,
            sizes: productSizes,
        };
        
        await addProduct(newProductData);
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
                                    <Label htmlFor="product-price">Price (₹)</Label>
                                    <Input id="product-price" name="productPrice" type="number" value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="e.g., 1999.00" required step="0.01" />
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
                                    <div className="flex gap-2">
                                        <Input 
                                            id="product-colors" 
                                            value={currentColor} 
                                            onChange={(e) => setCurrentColor(e.target.value)}
                                            onKeyDown={handleColorInputKeyDown}
                                            placeholder="e.g., Red"
                                        />
                                        <Button type="button" variant="outline" onClick={handleAddColor}>Add</Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Type a color and click Add or press Enter.</p>
                                    {productColors.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {productColors.map((color) => (
                                                <Badge key={color} variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
                                                    {color}
                                                    <button type="button" aria-label={`Remove ${color}`} onClick={() => handleRemoveColor(color)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-sizes">Sizes</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            id="product-sizes" 
                                            value={currentSize} 
                                            onChange={(e) => setCurrentSize(e.target.value)}
                                            onKeyDown={handleSizeInputKeyDown}
                                            placeholder="e.g., S, M, L..."
                                        />
                                        <Button type="button" variant="outline" onClick={handleAddSize}>Add</Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Type a size and click Add or press Enter.</p>
                                    {productSizes.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {productSizes.map((size) => (
                                                <Badge key={size} variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
                                                    {size}
                                                    <button type="button" aria-label={`Remove ${size}`} onClick={() => handleRemoveSize(size)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="product-image">Product Images</Label>
                                <Input
                                    id="product-image"
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={handleImageChange}
                                    className="file:text-foreground"
                                    multiple
                                />
                                <p className="text-xs text-muted-foreground">Max file size: 4MB per image.</p>
                                {imagePreviews.length > 0 ? (
                                    <div className="mt-4 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-medium">Image Previews:</p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setImagePreviews([]);
                                                    if (formRef.current) {
                                                        const fileInput = formRef.current.querySelector<HTMLInputElement>('#product-image');
                                                        if (fileInput) fileInput.value = '';
                                                    }
                                                }}
                                            >
                                                Clear Images
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {imagePreviews.map((src, index) => (
                                                <div key={index} className="relative aspect-square">
                                                    <Image
                                                        src={src}
                                                        alt={`Product image preview ${index + 1}`}
                                                        fill
                                                        className="rounded-md object-cover border"
                                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 p-4 border-2 border-dashed rounded-md text-center text-muted-foreground bg-secondary/30">
                                        <FileImage className="mx-auto h-8 w-8 mb-2" />
                                        <p className="text-sm">No images selected.</p>
                                        <p className="text-xs">If no images are chosen, a placeholder will be used.</p>
                                    </div>
                                )}
                            </div>
                             <div className="flex items-center space-x-2">
                                <Switch name="isNew" id="is-new" checked={isNew} onCheckedChange={setIsNew} />
                                <Label htmlFor="is-new">Mark as New Arrival</Label>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                )}
                                Add Product
                            </Button>
                             <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </div>
    );
}
