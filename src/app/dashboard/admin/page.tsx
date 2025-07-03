
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { BarChart, Package, ShoppingCart, Users, Loader2, UserCircle, Mail, MapPin, Database, Trash2, CreditCard, Search, ListFilter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Order, OrderStatus, Product } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/use-products';
import { ScrollArea } from '@/components/ui/scroll-area';
import { database, storage } from '@/lib/firebase';
import { ref as dbRef, get, set, push, remove, update } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { products as staticProducts, categories } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const ADMIN_EMAIL = "admin@example.com";

export default function AdminDashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSeeding, setIsSeeding] = useState(false);
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
    const [updatedStatus, setUpdatedStatus] = useState<OrderStatus | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const { products, loading: productsLoading } = useProducts();
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    
    const [usersCount, setUsersCount] = useState(0);
    const [usersLoading, setUsersLoading] = useState(true);

    // State for product filtering and sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedColor, setSelectedColor] = useState('All');
    const [selectedSize, setSelectedSize] = useState('All');
    const [sortOption, setSortOption] = useState('default');

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/login');
        } else if (user.email !== ADMIN_EMAIL) {
            router.push('/dashboard/user');
        }
    }, [user, loading, router]);
    
    useEffect(() => {
        async function fetchUsers() {
            if (!user || user.email !== ADMIN_EMAIL || !database) {
                setUsersLoading(false);
                return;
            }
            setUsersLoading(true);
            const usersRef = dbRef(database, 'users');
            try {
                const snapshot = await get(usersRef);
                if (snapshot.exists()) {
                    setUsersCount(Object.keys(snapshot.val()).length);
                } else {
                    setUsersCount(0);
                }
            } catch (error: any) {
                console.error('Failed to fetch user count:', error);
                // Optionally show a toast, but can be noisy
            }
            setUsersLoading(false);
        }
        if (user) {
            fetchUsers();
        }
    }, [user]);

    useEffect(() => {
        async function fetchOrders() {
            if (user?.email !== ADMIN_EMAIL) return;
            if (!database) {
                toast({ variant: 'destructive', title: 'Firebase Not Configured' });
                setOrdersLoading(false);
                return;
            }
            setOrdersLoading(true);
            const ordersRef = dbRef(database, 'orders');
            try {
                const snapshot = await get(ordersRef);
                if (snapshot.exists()) {
                    const ordersData = snapshot.val();
                    const ordersList: Order[] = Object.keys(ordersData)
                        .map(key => ({ id: key, ...ordersData[key] }))
                        .reverse();
                    setOrders(ordersList);
                } else {
                    setOrders([]);
                }
            } catch (error: any) {
                console.error('Failed to fetch orders:', error);
                let desc = 'An error occurred while fetching orders.';
                if (error.code === 'PERMISSION_DENIED') {
                    desc = "Permission denied. Check your Firebase rules.";
                }
                toast({ variant: 'destructive', title: 'Failed to fetch orders', description: desc });
            }
            setOrdersLoading(false);
        }
        if(user) {
            fetchOrders();
        }
    }, [user, toast]);

    const stats = useMemo(() => {
        const totalRevenue = orders.reduce((acc, order) => {
            if(order.status === 'Delivered'){
                return acc + order.total;
            }
            return acc;
        }, 0);
        return {
            totalRevenue,
            totalOrders: orders.length,
        };
    }, [orders]);

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
                    product.id.toLowerCase().includes(lowercasedQuery) ||
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

    const handleSeedDatabase = async () => {
        if (!database) {
            toast({ error: 'Firebase is not configured. Cannot seed database.' });
            return;
        }

        setIsSeeding(true);
        const productsRef = dbRef(database, 'products');
        
        try {
            const snapshot = await get(productsRef);
            if (snapshot.exists()) {
                toast({ variant: 'destructive', title: 'Database Seeding Failed', description: 'Database already contains products. Seeding aborted.' });
            } else {
                const productsToSeed: { [key: string]: Product } = {};
                staticProducts.forEach(product => {
                    const newProductRef = push(productsRef);
                    const newId = newProductRef.key;
                    if (newId) {
                        productsToSeed[newId] = { ...product, id: newId };
                    }
                });

                if (Object.keys(productsToSeed).length > 0) {
                    await set(productsRef, productsToSeed);
                    toast({ title: 'Database Seeding Successful', description: `Successfully seeded ${staticProducts.length} products.` });
                } else if (staticProducts.length > 0) {
                    toast({ variant: 'destructive', title: 'Database Seeding Failed', description: 'Failed to generate IDs for seeding.' });
                }
            }
        } catch (error: any) {
            console.error('Database seeding failed:', error);
            let errorMessage = 'An unknown error occurred during database seeding.';
            if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
                errorMessage = "Permission denied. Please check your Firebase Realtime Database security rules.";
            }
            toast({ variant: 'destructive', title: 'Database Seeding Failed', description: errorMessage });
        }
        setIsSeeding(false);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete || !database || !storage) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: 'Configuration or product data is missing.' });
            return;
        };

        setIsDeleting(true);

        try {
            // Delete from Realtime Database
            const productRef = dbRef(database, `products/${productToDelete.id}`);
            await remove(productRef);

            // Delete images from Storage
            const imageDeletionPromises = productToDelete.images
                .filter(url => url && url.includes('firebasestorage.googleapis.com'))
                .map(url => {
                    try {
                        const imageRef = storageRef(storage, url);
                        return deleteObject(imageRef).catch(err => {
                            if (err.code === 'storage/object-not-found') {
                                console.warn(`Image not found, skipping: ${url}`);
                                return null;
                            }
                            throw err;
                        });
                    } catch (e) {
                        console.error(`Invalid storage URL: ${url}`, e);
                        return null;
                    }
                });
            
            const validPromises = imageDeletionPromises.filter((p): p is Promise<void> => p !== null);
            if (validPromises.length > 0) {
                await Promise.allSettled(validPromises);
            }

            toast({ title: 'Product Deleted', description: 'Product and its images were successfully deleted.' });
        } catch (error: any) {
            console.error('Deletion failed:', error);
            let errorMessage = 'An unexpected error occurred.';
            if (error.code === 'PERMISSION_DENIED' || error.message.includes('permission_denied')) {
                errorMessage = "Permission denied. Check your Firebase rules for database writes and storage deletes.";
            }
            toast({ variant: 'destructive', title: 'Deletion Failed', description: errorMessage });
        } finally {
            setIsDeleting(false);
            setProductToDelete(null);
            setIsAlertOpen(false);
        }
    };
    
    if (loading || !user || user.email !== ADMIN_EMAIL) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setUpdatedStatus(order.status);
        setIsViewOrderOpen(true);
    }

    const handleUpdateOrderStatus = async () => {
        if (!selectedOrder || !updatedStatus || !database) return;
        setIsUpdatingStatus(true);
        
        const orderRef = dbRef(database, `orders/${selectedOrder.id}`);
        try {
            await update(orderRef, { status: updatedStatus });
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === selectedOrder.id ? { ...order, status: updatedStatus! } : order
                )
            );
            toast({ title: "Status Updated", description: `Order status changed to ${updatedStatus}.` });
        } catch (error: any) {
            let desc = 'An error occurred while updating the order status.';
            if (error.code === 'PERMISSION_DENIED') {
                desc = "Permission Denied. Check your Firebase security rules.";
            }
            toast({ variant: 'destructive', title: 'Update Failed', description: desc });
        }

        setIsUpdatingStatus(false);
        setIsViewOrderOpen(false);
    };

  return (
    <>
    <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col gap-8">
            <div className="text-left">
                <h1 className="text-4xl font-bold tracking-tighter font-headline">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    An overview of your store's performance.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Based on delivered orders</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                           {usersLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : usersCount}
                        </div>
                        <p className="text-xs text-muted-foreground">Total registered users</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ordersLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalOrders}</div>
                        <p className="text-xs text-muted-foreground">Total orders placed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products in Stock</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold">
                            {productsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : products.length}
                        </div>
                        <p className="text-xs text-muted-foreground">Products currently in store</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>A list of the most recent orders.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Order ID</TableHead>
                                <TableHead className="hidden md:table-cell">Customer</TableHead>
                                <TableHead className="hidden md:table-cell">Date</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ordersLoading ? (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium truncate">{order.id}</TableCell>
                                    <TableCell className="hidden md:table-cell">{order.user}</TableCell>
                                    <TableCell className="hidden md:table-cell">{order.date}</TableCell>
                                    <TableCell>₹{order.total.toFixed(2)}</TableCell>
                                    <TableCell>
                                    <Badge 
                                        variant={
                                            order.status === 'Pending' ? 'destructive' :
                                            order.status === 'Shipped' ? 'default' :
                                            order.status === 'Delivered' ? 'secondary' :
                                            'outline'
                                        }
                                    >
                                        {order.status}
                                    </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="link" size="sm" onClick={() => handleViewOrder(order)}>View Order</Button>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No orders found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Manage Products</CardTitle>
                        <CardDescription>View, filter, and delete products from your store.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search by name, ID, or category..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger>
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
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Colors" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableColors.map(color => (
                                            <SelectItem key={color} value={color}>{color === 'All' ? 'All Colors' : color}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={selectedSize} onValueChange={setSelectedSize}>
                                    <SelectTrigger>
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
                                        <Button variant="outline" className="w-full">
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
                                            <DropdownMenuRadioItem value="name-asc">Name: A-Z</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="name-desc">Name: Z-A</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <ScrollArea className="h-72">
                            <div className="space-y-4 pr-4">
                                {productsLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredProducts.length > 0 ? (
                                    filteredProducts.map(product => (
                                        <div key={product.id} className="flex items-center justify-between p-3 rounded-md hover:bg-secondary">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{product.name}</p>
                                                <p className="text-sm text-muted-foreground">₹{product.price.toFixed(2)}</p>
                                            </div>
                                            <Button variant="destructive" size="icon" className="flex-shrink-0 ml-4" onClick={() => { setProductToDelete(product); setIsAlertOpen(true); }}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete {product.name}</span>
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-full py-10">
                                        <p className="text-muted-foreground text-center">No products match your filters.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Database Tools</CardTitle>
                        <CardDescription>One-time actions to manage store data.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-start gap-4">
                            <Button onClick={handleSeedDatabase} disabled={isSeeding}>
                                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                                Seed Initial Products
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Use this to populate your database with the initial 8 products. This action will only work if your products collection is empty.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
    
    {selectedOrder && (
        <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Order Details</DialogTitle>
                    <DialogDescription>Order ID: {selectedOrder.id}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Customer Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <UserCircle className="h-5 w-5 text-muted-foreground" />
                                    <span>{selectedOrder.user}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <span>{selectedOrder.userEmail}</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                                    <span>{selectedOrder.shippingAddress}</span>
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2"><CreditCard className="h-4 w-4"/>Payment Method</span>
                                    <Badge variant={selectedOrder.paymentMethod === 'COD' ? 'outline' : 'secondary'}>
                                        {selectedOrder.paymentMethod}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Status</span>
                                    <Select value={updatedStatus ?? ''} onValueChange={(value: OrderStatus) => setUpdatedStatus(value)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Update status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Shipped">Shipped</SelectItem>
                                            <SelectItem value="Delivered">Delivered</SelectItem>
                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Date</span>
                                    <span>{selectedOrder.date}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span className="text-primary">Total Amount</span>
                                    <span className="text-primary">₹{selectedOrder.total.toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4">Items Ordered</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-center">Quantity</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedOrder.items.map(item => (
                                    <TableRow key={item.productId}>
                                        <TableCell className="font-medium">{item.productName}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-medium">₹{(item.quantity * item.price).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsViewOrderOpen(false)} disabled={isUpdatingStatus}>Cancel</Button>
                    <Button onClick={handleUpdateOrderStatus} disabled={isUpdatingStatus}>
                        {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Status
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )}

    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the product
                    <span className="font-bold"> "{productToDelete?.name}" </span>
                    and all of its associated images from the servers.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setProductToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className={cn(buttonVariants({ variant: "destructive" }))}>
                    {isDeleting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                        </>
                    ) : (
                        "Delete Product"
                    )}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

    

    