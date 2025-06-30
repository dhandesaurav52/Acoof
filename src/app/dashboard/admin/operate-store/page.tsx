
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
import { database, storage } from '@/lib/firebase';
import { ref as dbRef, set, push, child } from "firebase/database";
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';

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
    const [productColors, setProductColors] = useState('');
    const [productSizes, setProductSizes] = useState('');
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
    
    const addProduct = useCallback(async (productData: Omit<Product, 'id'>): Promise<{ success?: string; error?: string; }> => {
        if (!database || !storage) {
            return { error: 'Firebase is not configured. Cannot add product.' };
        }
        
        if (!productData.name || !productData.price || !productData.category) {
            return { error: 'Missing required product fields: name, price, or category.' };
        }

        try {
            let imageUrls: string[] = [];
            
            if (productData.images && productData.images.length > 0 && productData.images[0].startsWith('data:')) {
                let uploadErrorOccurred: string | null = null;

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
                        if (uploadError.code === 'storage/unauthorized') {
                            uploadErrorOccurred = "Permission denied for Firebase Storage. Please check your Storage security rules to allow writes to the 'products' path for authenticated users.";
                        } else {
                            uploadErrorOccurred = `An error occurred during image upload: ${uploadError.message}`;
                        }
                        return null;
                    }
                });

                const settledImageUrls = await Promise.all(uploadPromises);

                if (uploadErrorOccurred) {
                    return { error: uploadErrorOccurred };
                }

                imageUrls = settledImageUrls.filter((url): url is string => url !== null);
                
                if (imageUrls.length !== productData.images.length) {
                    return { error: "One or more images failed to upload. Product not added." };
                }

            } else {
                imageUrls = productData.images?.length > 0 ? productData.images : ['https://placehold.co/600x800.png'];
            }

            const newProductRef = push(dbRef(database, 'products'));
            const newId = newProductRef.key;
            if (!newId) {
                 return { error: 'Failed to generate a new product ID from Firebase.' };
            }

            const productToSave: Product = {
                ...productData,
                id: newId,
                images: imageUrls,
            };

            await set(newProductRef, productToSave);

            return { success: `Successfully added product: ${productToSave.name}` };

        } catch (error: any) {
            console.error('Failed to add product:', error);
            let errorMessage = error.message || 'An unknown error occurred while adding the product.';
            if (error.code === 'database/permission-denied') {
                errorMessage = "Permission denied for Firebase Realtime Database. Please check your Database security rules.";
            }
            return { error: errorMessage };
        }
    }, []);

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
        setProductColors('');
        setProductSizes('');
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
            colors: productColors ? productColors.split(',').map(s => s.trim()).filter(Boolean) : [],
            sizes: productSizes ? productSizes.split(',').map(s => s.trim()).filter(Boolean) : [],
        };
        
        try {
            const result = await addProduct(newProductData);

            if (result.error) {
                 toast({
                    variant: "destructive",
                    title: "Failed to Add Product",
                    description: result.error,
                });
            } else {
                toast({
                    title: "Product Added",
                    description: `${newProductData.name} has been successfully added to the store.`,
                });
                resetForm();
            }
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
