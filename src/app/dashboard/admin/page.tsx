
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { BarChart, Package, ShoppingCart, Users, Loader2, UserCircle, Mail, MapPin, Database, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Order, OrderStatus, Product } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { seedDatabase } from '@/app/actions';
import { useProducts } from '@/hooks/use-products';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Imports for Deletion Logic ---
import { database, storage } from '@/lib/firebase';
import { ref as dbRef, remove } from "firebase/database";
import { ref as storageRef, deleteObject } from 'firebase/storage';

const ADMIN_EMAIL = "admin@example.com";

export default function AdminDashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSeeding, setIsSeeding] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
    const [updatedStatus, setUpdatedStatus] = useState<OrderStatus | null>(null);

    // New state for product deletion
    const { products, loading: productsLoading } = useProducts();
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/login');
        } else if (user.email !== ADMIN_EMAIL) {
            router.push('/dashboard/user');
        }
    }, [user, loading, router]);

    const handleSeedDatabase = async () => {
        setIsSeeding(true);
        const result = await seedDatabase();
        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Database Seeding Failed',
                description: result.error,
            });
        } else {
            toast({
                title: 'Database Seeding Successful',
                description: result.success,
            });
        }
        setIsSeeding(false);
    };

    // --- Product Deletion Logic (Moved from actions.ts) ---
    async function deleteProduct(productId: string, imageUrls: string[]): Promise<{ success?: string; error?: string; }> {
      if (!database || !storage) {
        return { error: 'Firebase is not configured. Cannot delete product.' };
      }

      const imageDeletionPromises = imageUrls
        .filter(url => url && url.includes('firebasestorage.googleapis.com'))
        .map(url => {
          try {
            const imageRef = storageRef(storage, url);
            return deleteObject(imageRef).catch(err => {
                if (err.code === 'storage/object-not-found') {
                    console.warn(`Image not found, skipping deletion: ${url}`);
                    return null;
                }
                throw err;
            });
          } catch (e) {
            console.error(`Invalid storage URL, skipping deletion: ${url}`, e);
            return null;
          }
        });
      
      const validPromises = imageDeletionPromises.filter((p): p is Promise<void> => p !== null);

      if (validPromises.length > 0) {
          const results = await Promise.allSettled(validPromises);
          const failedDeletions = results.filter(result => result.status === 'rejected');

          if (failedDeletions.length > 0) {
              const firstError = (failedDeletions[0] as PromiseRejectedResult).reason;
              let errorMessage = "Failed to remove one or more images.";
              if (firstError?.code === 'storage/unauthorized') {
                  errorMessage = "Storage permission was denied for image removal. Please check your Firebase Storage security rules.";
              }
              return { error: errorMessage };
          }
      }

      try {
        const productRef = dbRef(database, `products/${productId}`);
        await remove(productRef);
      } catch (error: any) {
        console.error('Database deletion failed:', error);
        if (error.code === 'PERMISSION_DENIED' || error.message.includes('permission_denied')) {
          return { error: "Database permission was denied for product data. Please check your Realtime Database security rules." };
        }
        return { error: `An unexpected error occurred while deleting product data: ${error.message}` };
      }

      return { success: 'Product and associated images were successfully deleted.' };
    }

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);

        const { success, error } = await deleteProduct(productToDelete.id, productToDelete.images);

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: error,
            });
        } else {
            toast({
                title: 'Product Deleted',
                description: success,
            });
        }
        
        setIsDeleting(false);
        setProductToDelete(null);
        setIsAlertOpen(false);
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

    const handleUpdateOrderStatus = () => {
        if (!selectedOrder || !updatedStatus) return;

        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === selectedOrder.id ? { ...order, status: updatedStatus } : order
            )
        );
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

            {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$0.00</div>
                        <p className="text-xs text-muted-foreground">No revenue data yet</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">No new customers yet</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.length}</div>
                        <p className="text-xs text-muted-foreground">No orders yet</p>
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
                {/* Recent Orders Table */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>A list of the most recent orders.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.id}</TableCell>
                                    <TableCell>{order.user}</TableCell>
                                    <TableCell>{order.date}</TableCell>
                                    <TableCell>${order.total.toFixed(2)}</TableCell>
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

                {/* Manage Products Card - NEW */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Manage Products</CardTitle>
                        <CardDescription>View and delete existing products from your store.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-72">
                            <div className="space-y-4 pr-4">
                                {productsLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : products.length > 0 ? (
                                    products.map(product => (
                                        <div key={product.id} className="flex items-center justify-between p-3 rounded-md hover:bg-secondary">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{product.name}</p>
                                                <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                                            </div>
                                            <Button variant="destructive" size="icon" className="flex-shrink-0 ml-4" onClick={() => { setProductToDelete(product); setIsAlertOpen(true); }}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete {product.name}</span>
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-muted-foreground text-center">No products found.</p>
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
                                    <span className="text-primary">${selectedOrder.total.toFixed(2)}</span>
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
                                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-medium">${(item.quantity * item.price).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsViewOrderOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpdateOrderStatus}>Update Status</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )}

    {/* Delete Confirmation Dialog - NEW */}
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
                <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
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
