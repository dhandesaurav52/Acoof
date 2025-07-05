
'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Package, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Order, OrderStatus } from '@/types';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, off, update } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { clearAllOrders, deleteOrder } from '@/app/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ADMIN_EMAIL = "admin@example.com";

export default function AdminOrdersPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


    // The AdminLayout now handles auth checks and redirection.
    // This page will only render if the user is a confirmed admin.
    useEffect(() => {
        // This effect is now dependent on the user object.
        // It will not run until auth state is resolved and a user is present.
        if (!user) {
          setLoadingData(false);
          return;
        }

        // Failsafe: Double-check admin status to prevent race conditions.
        if (user.email !== ADMIN_EMAIL) {
            setLoadingData(false);
            return;
        }

        if (!database) {
            setError("Firebase is not configured correctly.");
            setLoadingData(false);
            return;
        }

        const ordersRef = ref(database, 'orders');
        const listener = onValue(ordersRef, (snapshot) => {
            if (snapshot.exists()) {
                const ordersData = snapshot.val();
                const ordersList: Order[] = Object.keys(ordersData)
                    .map(key => ({ id: key, ...ordersData[key] }))
                    .reverse();
                setOrders(ordersList);
            } else {
                setOrders([]);
            }
            setError(null);
            setLoadingData(false);
        }, (err: any) => {
            console.error("Firebase read failed: ", err);
            if (err.code === 'PERMISSION_DENIED' || err.message?.includes('permission_denied')) {
                setError("Permission Denied. Could not fetch orders. This is almost always a Firebase security rule issue. Please verify two things: 1) You are logged in as the admin user (admin@example.com). 2) Your Realtime Database security rules allow the admin user to read the '/orders' path. Please check your Firebase console.");
            } else {
                setError("An error occurred while fetching orders data.");
            }
            setLoadingData(false);
        });

        // Cleanup function for the listener
        return () => {
            if (database && ordersRef) {
                off(ordersRef, 'value', listener);
            }
        };
    }, [user]);

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        if (!database) return;

        const orderRef = ref(database, `orders/${orderId}`);
        try {
            await update(orderRef, { status: newStatus });
            toast({
                title: "Status Updated",
                description: `Order #${orderId} has been updated to ${newStatus}.`
            });
        } catch (error: any) {
            // This is a special check to handle a "race condition" where the user
            // logs out immediately after changing a status. The update fails with
            // a permission error, but we don't want to show a confusing error
            // toast on the login screen. We check the live auth state.
            if (error.code === 'PERMISSION_DENIED' && !auth?.currentUser) {
                console.warn("Order update permission denied, user has logged out.");
                return; // Silently ignore the error
            }

            // If we are here, it's a genuine error.
            console.error("Failed to update order status:", error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'An unexpected error occurred while updating the order status.',
            });
        }
    };

    const handleClearOrders = async () => {
        setIsClearing(true);
        const result = await clearAllOrders();
        if (result.success) {
            toast({ title: 'Success', description: 'All orders have been deleted.' });
        } else {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: result.error });
        }
        setIsClearing(false);
        setIsClearConfirmOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (!orderToDelete) return;
        setIsDeleting(true);
        const result = await deleteOrder(orderToDelete);
        if (result.success) {
            toast({ title: 'Success', description: 'Order has been deleted.' });
        } else {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: result.error });
        }
        setIsDeleting(false);
        setOrderToDelete(null);
    };
    
    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-12 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="text-left">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter font-headline">Manage Orders</h1>
                    <p className="text-muted-foreground mt-2">
                        View and update the status of all customer orders.
                    </p>
                </div>
                
                {error ? (
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="h-6 w-6" />
                                Data Fetching Error
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-destructive">{error}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>All Orders</CardTitle>
                                    <CardDescription>A list of all orders placed in your store.</CardDescription>
                                </div>
                                <Button variant="destructive" onClick={() => setIsClearConfirmOpen(true)} disabled={orders.length === 0 || isClearing}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Clear All Orders
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                            <TableHead className="text-center">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.length > 0 ? orders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell>
                                                    <div className="font-medium truncate max-w-[120px]">{order.id}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{order.user}</div>
                                                    <div className="text-xs text-muted-foreground">{order.userEmail}</div>
                                                </TableCell>
                                                <TableCell>{order.date}</TableCell>
                                                <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                                                <TableCell className="text-center">
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
                                                <TableCell>
                                                    <div className="flex justify-center items-center gap-2">
                                                        <Select
                                                            value={order.status}
                                                            onValueChange={(value: OrderStatus) => handleStatusChange(order.id, value)}
                                                        >
                                                            <SelectTrigger className="w-[120px] h-8">
                                                                <SelectValue placeholder="Update Status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Pending">Pending</SelectItem>
                                                                <SelectItem value="Shipped">Shipped</SelectItem>
                                                                <SelectItem value="Delivered">Delivered</SelectItem>
                                                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        
                                                        {order.status === 'Pending' || order.status === 'Cancelled' ? (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="icon" onClick={() => setOrderToDelete(order)}>
                                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Delete Order</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ) : (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span tabIndex={0}>
                                                                            <Button variant="ghost" size="icon" disabled className="pointer-events-none">
                                                                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                                            </Button>
                                                                        </span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Only 'Pending' or 'Cancelled' orders can be deleted.</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center h-24">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Package className="h-8 w-8 text-muted-foreground" />
                                                        <span>No orders found.</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all {orders.length} orders and their references from all user profiles. This is intended for testing and development purposes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleClearOrders} 
                            disabled={isClearing} 
                            className={buttonVariants({ variant: "destructive" })}
                        >
                            {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Yes, delete all orders
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete order #{orderToDelete?.id}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className={buttonVariants({ variant: "destructive" })}
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Yes, delete order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
