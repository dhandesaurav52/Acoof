
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, PlusCircle, UploadCloud } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { categories } from '@/lib/data';
import { database, storage } from '@/lib/firebase';
import { ref as dbRef, push, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  category: z.string().min(1, "Please select a category"),
  isNew: z.boolean().default(false),
  colors: z.string().optional(),
  sizesText: z.string().optional(),
  sizesNumeric: z.string().optional(),
  images: z.custom<FileList>().refine((files) => files.length > 0, "At least one image is required."),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AddProductPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    
    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: { isNew: true }
    });

    const watchedImages = watch("images");

    useEffect(() => {
        if (watchedImages && watchedImages.length > 0) {
            const newPreviews = Array.from(watchedImages).map(file => URL.createObjectURL(file));
            setImagePreviews(newPreviews);
            return () => newPreviews.forEach(url => URL.revokeObjectURL(url));
        }
        setImagePreviews([]);
    }, [watchedImages]);

    // Auth is now handled by the AdminLayout. This page only renders for admins.

    const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
        if (!database || !storage) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firebase is not configured. Cannot add product.' });
            return;
        }
        setIsSubmitting(true);

        try {
            const newProductRef = push(dbRef(database, 'products'));
            const newProductId = newProductRef.key;
            if (!newProductId) throw new Error("Failed to generate a new product ID.");
            
            const imageUrls: string[] = [];
            for (const file of Array.from(data.images)) {
                const imageFileRef = storageRef(storage, `products/${newProductId}/${file.name}`);
                await uploadBytes(imageFileRef, file);
                const url = await getDownloadURL(imageFileRef);
                imageUrls.push(url);
            }

            const textSizes = data.sizesText ? data.sizesText.split(',').map(s => s.trim()).filter(Boolean) : [];
            const numericSizes = data.sizesNumeric ? data.sizesNumeric.split(',').map(s => s.trim()).filter(Boolean) : [];
            const allSizes = [...textSizes, ...numericSizes];

            const productData = {
                name: data.name,
                description: data.description,
                price: data.price,
                category: data.category,
                isNew: data.isNew,
                images: imageUrls,
                colors: data.colors ? data.colors.split(',').map(s => s.trim()).filter(Boolean) : [],
                sizes: allSizes,
            };

            await set(newProductRef, productData);
            toast({ title: "Product Added", description: `"${data.name}" has been successfully added to the store.` });
            router.push('/dashboard/admin');

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: "Could not add product. Please check console for details.",
            });
            console.error("Failed to add product:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="container mx-auto py-12 px-4">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Add New Product</CardTitle>
                    <CardDescription>Fill out the form below to add a new product to your store catalog.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Product Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name</Label>
                                <Input id="name" {...register("name")} />
                                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (₹)</Label>
                                <Input id="price" type="number" step="0.01" {...register("price")} />
                                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...register("description")} />
                            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select onValueChange={(value) => setValue('category', value)} defaultValue={control._defaultValues.category}>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="colors">Colors (comma-separated)</Label>
                                <Input id="colors" {...register("colors")} placeholder="e.g., Black, White, Blue"/>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Label htmlFor="sizesText">Text-based Sizes (comma-separated)</Label>
                                <Input id="sizesText" {...register("sizesText")} placeholder="e.g., S, M, L, XL, XXL" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sizesNumeric">Numeric Sizes (comma-separated)</Label>
                                <Input id="sizesNumeric" {...register("sizesNumeric")} placeholder="e.g., 28, 30, 32" />
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <Label>Product Images</Label>
                             <div className="relative border-2 border-dashed border-muted rounded-lg p-6 text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Drag & drop files here, or click to select files</p>
                                <Input id="images" type="file" {...register("images")} multiple accept="image/png, image/jpeg, image/webp" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            </div>
                            {errors.images && <p className="text-sm text-destructive">{errors.images.message}</p>}
                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {imagePreviews.map((src, index) => (
                                        <div key={index} className="relative aspect-square">
                                            <Image src={src} alt={`Preview ${index}`} fill className="rounded-md object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Switch id="isNew" {...register("isNew")} defaultChecked={control._defaultValues.isNew} onCheckedChange={(checked) => setValue('isNew', checked)} />
                            <Label htmlFor="isNew">Mark as New Arrival</Label>
                        </div>
                        
                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/admin')} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding Product...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Product
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
