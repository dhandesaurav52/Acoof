
'use client';

import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, PlusCircle, UploadCloud, Edit, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { useProducts } from '@/hooks/use-products';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Product } from '@/types';


const addProductSchema = z.object({
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

type AddProductFormValues = z.infer<typeof addProductSchema>;

const editProductSchema = addProductSchema.omit({ images: true });
type EditProductFormValues = z.infer<typeof editProductSchema>;


export default function ManageStorePage() {
    const router = useRouter();
    const { toast } = useToast();

    // Add Product States and Form
    const [isAddSubmitting, setIsAddSubmitting] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const { register: registerAdd, handleSubmit: handleSubmitAdd, control: controlAdd, watch: watchAdd, setValue: setValueAdd, reset: resetAdd, formState: { errors: errorsAdd } } = useForm<AddProductFormValues>({
        resolver: zodResolver(addProductSchema),
        defaultValues: { isNew: true, name: '', description: '', price: 0, category: '', colors: '', sizesText: '', sizesNumeric: '', images: undefined }
    });
    const watchedImages = watchAdd("images");
    useEffect(() => {
        if (watchedImages && watchedImages.length > 0) {
            const newPreviews = Array.from(watchedImages).map(file => URL.createObjectURL(file));
            setImagePreviews(newPreviews);
            return () => newPreviews.forEach(url => URL.revokeObjectURL(url));
        }
        setImagePreviews([]);
    }, [watchedImages]);

    // Manage Products States and Form
    const { products, loading: productsLoading, removeProduct, updateProduct } = useProducts();
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('default');
    
    const { register: registerEdit, handleSubmit: handleSubmitEdit, control: controlEdit, reset: resetEdit, watch: watchEdit, setValue: setValueEdit, formState: { errors: errorsEdit } } = useForm<EditProductFormValues>({
        resolver: zodResolver(editProductSchema),
    });

    const filteredAndSortedProducts = useMemo(() => {
        let processedProducts = [...products];

        if (searchQuery) {
            processedProducts = processedProducts.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        switch (sortOption) {
            case 'name-asc':
                processedProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                processedProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'price-asc':
                processedProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                processedProducts.sort((a, b) => b.price - a.price);
                break;
            default:
                break;
        }

        return processedProducts;
    }, [products, searchQuery, sortOption]);

    useEffect(() => {
        if (productToEdit) {
            resetEdit({
                name: productToEdit.name,
                description: productToEdit.description,
                price: productToEdit.price,
                category: productToEdit.category,
                isNew: productToEdit.isNew,
                colors: productToEdit.colors?.join(', '),
                sizesText: productToEdit.sizes?.filter(s => isNaN(Number(s))).join(', '),
                sizesNumeric: productToEdit.sizes?.filter(s => !isNaN(Number(s))).join(', '),
            });
        }
    }, [productToEdit, resetEdit]);

    const onAddSubmit: SubmitHandler<AddProductFormValues> = async (data) => {
        if (!database || !storage) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firebase is not configured. Cannot add product.' });
            return;
        }
        setIsAddSubmitting(true);
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
            await set(newProductRef, {
                name: data.name,
                description: data.description,
                price: data.price,
                category: data.category,
                isNew: data.isNew,
                images: imageUrls,
                colors: data.colors ? data.colors.split(',').map(s => s.trim()).filter(Boolean) : [],
                sizes: [...textSizes, ...numericSizes],
            });
            toast({ title: "Product Added", description: `"${data.name}" has been successfully added.` });
            resetAdd();
            setImagePreviews([]);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: "Could not add product." });
        } finally {
            setIsAddSubmitting(false);
        }
    };
    
    const onEditSubmit: SubmitHandler<EditProductFormValues> = async (data) => {
        if (!productToEdit) return;
        setIsEditSubmitting(true);
        try {
            const textSizes = data.sizesText ? data.sizesText.split(',').map(s => s.trim()).filter(Boolean) : [];
            const numericSizes = data.sizesNumeric ? data.sizesNumeric.split(',').map(s => s.trim()).filter(Boolean) : [];
            await updateProduct(productToEdit.id, {
                name: data.name,
                description: data.description,
                price: data.price,
                category: data.category,
                isNew: data.isNew,
                colors: data.colors ? data.colors.split(',').map(s => s.trim()).filter(Boolean) : [],
                sizes: [...textSizes, ...numericSizes],
            });
            toast({ title: "Product Updated", description: `"${data.name}" has been successfully updated.` });
            setProductToEdit(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Update Failed', description: "Could not update product." });
        } finally {
            setIsEditSubmitting(false);
        }
    };

    const onDeleteConfirm = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await removeProduct(productToDelete);
            toast({ title: "Product Deleted", description: `"${productToDelete.name}" has been removed.` });
            setProductToDelete(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: "Could not delete product." });
        } finally {
            setIsDeleting(false);
        }
    };
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Add New Product</CardTitle>
                    <CardDescription>Fill out the form below to add a new product to your store catalog.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Label htmlFor="name">Product Name</Label><Input id="name" {...registerAdd("name")} />{errorsAdd.name && <p className="text-sm text-destructive">{errorsAdd.name.message}</p>}</div>
                            <div className="space-y-2"><Label htmlFor="price">Price (₹)</Label><Input id="price" type="number" step="0.01" {...registerAdd("price")} />{errorsAdd.price && <p className="text-sm text-destructive">{errorsAdd.price.message}</p>}</div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" {...registerAdd("description")} />{errorsAdd.description && <p className="text-sm text-destructive">{errorsAdd.description.message}</p>}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Label htmlFor="category">Category</Label><Select onValueChange={(value) => setValueAdd('category', value)} value={watchAdd('category')}><SelectTrigger id="category"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select>{errorsAdd.category && <p className="text-sm text-destructive">{errorsAdd.category.message}</p>}</div>
                            <div className="space-y-2"><Label htmlFor="colors">Colors (comma-separated)</Label><Input id="colors" {...registerAdd("colors")} placeholder="e.g., Black, White, Blue"/></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Label htmlFor="sizesText">Text-based Sizes (comma-separated)</Label><Input id="sizesText" {...registerAdd("sizesText")} placeholder="e.g., S, M, L, XL, XXL" /></div>
                            <div className="space-y-2"><Label htmlFor="sizesNumeric">Numeric Sizes (comma-separated)</Label><Input id="sizesNumeric" {...registerAdd("sizesNumeric")} placeholder="e.g., 28, 30, 32" /></div>
                        </div>
                        <div className="space-y-4"><Label>Product Images</Label><div className="relative border-2 border-dashed border-muted rounded-lg p-6 text-center"><UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Drag & drop files here, or click to select files</p><Input id="images" type="file" {...registerAdd("images")} multiple accept="image/png, image/jpeg, image/webp" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /></div>{errorsAdd.images && <p className="text-sm text-destructive">{errorsAdd.images.message}</p>}{imagePreviews.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{imagePreviews.map((src, index) => <div key={index} className="relative aspect-square"><Image src={src} alt={`Preview ${index}`} fill className="rounded-md object-cover" /></div>)}</div>}</div>
                        <div className="flex items-center space-x-2"><Switch id="isNew" checked={watchAdd('isNew')} onCheckedChange={(checked) => setValueAdd('isNew', checked)} /><Label htmlFor="isNew">Mark as New Arrival</Label></div>
                        <div className="flex justify-end gap-4"><Button type="button" variant="outline" onClick={() => router.push('/dashboard/admin')} disabled={isAddSubmitting}>Cancel</Button><Button type="submit" disabled={isAddSubmitting}>{isAddSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding Product...</> : <><PlusCircle className="mr-2 h-4 w-4" />Add Product</>}</Button></div>
                    </form>
                </CardContent>
            </Card>

            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Manage Existing Products</CardTitle>
                    <CardDescription>View, edit, or delete products from your store catalog.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={sortOption} onValueChange={setSortOption}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Sort by: Default</SelectItem>
                                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                                <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {productsLoading ? (
                        <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Image</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="w-[120px] text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedProducts.length > 0 ? (
                                        filteredAndSortedProducts.map(product => (
                                            <TableRow key={product.id}>
                                                <TableCell><Image src={product.images[0] || 'https://placehold.co/80x80.png'} alt={product.name} width={60} height={60} className="rounded-md object-cover aspect-square" /></TableCell>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell>{product.category}</TableCell>
                                                <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => setProductToEdit(product)}><Edit className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => setProductToDelete(product)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                No products found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Dialog open={!!productToEdit} onOpenChange={(isOpen) => !isOpen && setProductToEdit(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>Make changes to "{productToEdit?.name}". Click save when you're done.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="edit-name">Product Name</Label><Input id="edit-name" {...registerEdit("name")} />{errorsEdit.name && <p className="text-sm text-destructive">{errorsEdit.name.message}</p>}</div>
                            <div className="space-y-2"><Label htmlFor="edit-price">Price (₹)</Label><Input id="edit-price" type="number" step="0.01" {...registerEdit("price")} />{errorsEdit.price && <p className="text-sm text-destructive">{errorsEdit.price.message}</p>}</div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="edit-description">Description</Label><Textarea id="edit-description" {...registerEdit("description")} />{errorsEdit.description && <p className="text-sm text-destructive">{errorsEdit.description.message}</p>}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-category">Category</Label>
                                <Select onValueChange={(value) => setValueEdit('category', value)} value={watchEdit('category')}>
                                    <SelectTrigger id="edit-category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                                    <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                                </Select>
                                {errorsEdit.category && <p className="text-sm text-destructive">{errorsEdit.category.message}</p>}
                            </div>
                            <div className="space-y-2"><Label htmlFor="edit-colors">Colors (comma-separated)</Label><Input id="edit-colors" {...registerEdit("colors")} placeholder="e.g., Black, White, Blue"/></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="edit-sizesText">Text-based Sizes (comma-separated)</Label><Input id="edit-sizesText" {...registerEdit("sizesText")} placeholder="e.g., S, M, L, XL, XXL" /></div>
                            <div className="space-y-2"><Label htmlFor="edit-sizesNumeric">Numeric Sizes (comma-separated)</Label><Input id="edit-sizesNumeric" {...registerEdit("sizesNumeric")} placeholder="e.g., 28, 30, 32" /></div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2"><Switch id="edit-isNew" checked={watchEdit("isNew")} onCheckedChange={(checked) => setValueEdit('isNew', checked)} /><Label htmlFor="edit-isNew">Mark as New Arrival</Label></div>
                        <DialogFooter className="pt-4 border-t sticky bottom-0 bg-background py-4">
                            <Button type="button" variant="outline" onClick={() => setProductToEdit(null)}>Cancel</Button>
                            <Button type="submit" disabled={isEditSubmitting}>{isEditSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the product "{productToDelete?.name}" and all of its images.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDeleteConfirm} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
