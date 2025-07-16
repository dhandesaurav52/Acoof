'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, FileText, Package, Truck, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Order, OrderStatus, Notification } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { auth, database } from '@/lib/firebase';
import { ref, get, update, push, set } from 'firebase/database';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { differenceInDays } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import Link from 'next/link';


export default function UserOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);
    
    useEffect(() => {
        async function fetchUserOrders() {
            if (!user?.uid || !database) {
                setLoading(false);
                return;
            };

            setLoading(true);
            setError(null);
            
            try {
                // 1. Get the list of order IDs from the user's profile
                const userOrdersRef = ref(database, `users/${user.uid}/orders`);
                const orderIdsSnapshot = await get(userOrdersRef);

                if (!orderIdsSnapshot.exists()) {
                    setOrders([]);
                    setLoading(false);
                    return;
                }

                const orderIds = Object.keys(orderIdsSnapshot.val());

                // 2. Fetch each order individually
                const orderPromises = orderIds.map(orderId => {
                    const orderRef = ref(database, `orders/${orderId}`);
                    return get(orderRef);
                });
                
                const orderSnapshots = await Promise.all(orderPromises);
                
                const ordersList: Order[] = orderSnapshots
                    .map(snapshot => snapshot.exists() ? ({ ...snapshot.val(), id: snapshot.key }) as Order : null)
                    .filter((order): order is Order => order !== null)
                    .reverse(); // Show newest first
                
                setOrders(ordersList);

            } catch (error: any) {
                console.error('Failed to fetch user orders:', error);
                let desc = 'An error occurred while fetching your orders.';
                if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
                    desc = "Permission Denied: Could not fetch order data. This is a Firebase security rule issue. To fix, please go to your Firebase project's Realtime Database rules and ensure authenticated users can read their own data under '/users/[their-id]' and can read individual orders from '/orders/[order-id]'.";
                }
                setError(desc);
            }
            setLoading(false);
        }

        if (user) {
            fetchUserOrders();
        }
    }, [user]);
    
    if (authLoading || loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const getStatusIcon = (status: Order['status']) => {
        switch (status) {
            case 'Pending': return <Package className="h-5 w-5 text-yellow-500" />;
            case 'Shipped': return <Truck className="h-5 w-5 text-blue-500" />;
            case 'Delivered': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'Cancelled': return <XCircle className="h-5 w-5 text-red-500" />;
            default: return <FileText className="h-5 w-5 text-muted-foreground" />;
        }
    }

    const isOrderCancellable = (order: Order): { cancellable: boolean; reason: string } => {
        if (order.status !== 'Pending' && order.status !== 'Delivered') {
            return { cancellable: false, reason: `This order cannot be modified as its status is '${order.status}'.` };
        }
        
        try {
            const orderDate = new Date(order.date);
            const daysSinceOrder = differenceInDays(new Date(), orderDate);
            
            if (daysSinceOrder > 7) {
                return { cancellable: false, reason: 'This order is outside the 7-day return window.' };
            }
        } catch(e) {
            console.error("Could not parse order date:", order.date, e);
            return { cancellable: false, reason: 'Could not determine order date.' };
        }
        
        return { cancellable: true, reason: '' };
    };

    const handleConfirmCancel = async () => {
        if (!orderToCancel || !database || !user || !user.email) return;
        
        if (!cancellationReason) {
            toast({
                variant: 'destructive',
                title: 'Reason Required',
                description: 'Please provide a reason for the request.',
            });
            return;
        }

        setIsCancelling(true);
    
        const newStatus: OrderStatus = 'Cancelled';
        const reason = cancellationReason;
        const orderUpdate = {
            status: newStatus,
            cancellationReason: reason
        };
    
        try {
            // Step 1: Update the order status. This is the critical operation.
            const orderRef = ref(database, `orders/${orderToCancel.id}`);
            await update(orderRef, orderUpdate);

            // Step 2: Create the admin notification (non-blocking).
            try {
                const notificationType = orderToCancel.status === 'Delivered' ? 'order_return' : 'order_cancellation';
                const newNotificationRef = push(ref(database, 'notifications'));
                const notificationId = newNotificationRef.key;

                if (notificationId) {
                    const notificationMessage = `User ${user.email} ${notificationType === 'order_return' ? 'initiated a return for' : 'cancelled'} order #${orderToCancel.id.slice(-6).toUpperCase()}.`;
                    const newNotification: Notification = {
                        id: notificationId,
                        type: notificationType,
                        message: notificationMessage,
                        timestamp: new Date().toISOString(),
                        read: false,
                        orderId: orderToCancel.id,
                        userId: user.uid,
                        userEmail: user.email,
                    };
                    await set(newNotificationRef, newNotification);
                }
            } catch (notificationError) {
                 console.error("Non-critical: Failed to create cancellation notification:", notificationError);
            }
    
            // Update local state to reflect the change immediately
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderToCancel.id ? { ...order, status: newStatus, cancellationReason: reason } : order
                )
            );
    
            toast({ 
                title: orderToCancel.status === 'Delivered' ? "Return Initiated" : "Order Cancelled", 
                description: orderToCancel.status === 'Delivered' ? "Your return request has been submitted." : "Your order has been successfully cancelled." 
            });
    
        } catch (error: any) {
            if (error.code === 'PERMISSION_DENIED' && !auth?.currentUser) {
                console.warn("Order cancellation permission denied, user has logged out.");
            } else {
                console.error('Failed to cancel order:', error);
                let errorMessage = 'An unexpected error occurred while cancelling the order.';
                if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
                    errorMessage = "Permission Denied: Could not update order status. Please check your Firebase Database security rules to ensure you can modify your own orders.";
                }
                toast({
                    variant: 'destructive',
                    title: 'Cancellation Failed',
                    description: errorMessage,
                });
            }
        } finally {
            setIsCancelling(false);
            setOrderToCancel(null);
            setCancellationReason('');
        }
    };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-left">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter font-headline">My Orders</h1>
                <p className="text-muted-foreground mt-2">
                    Track your purchase history and order status. You can return delivered items or cancel pending orders within 7 days of purchase.
                </p>
            </div>

            {error && (
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                            Failed to fetch orders
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-destructive">{error}</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-0">
                    {!error && orders.length > 0 ? (
                        <div className="divide-y">
                            {orders.map((order) => (
                                <div key={order.id} className="p-4 sm:p-6 flex items-center gap-4">
                                    <div className="hidden sm:block">
                                        {getStatusIcon(order.status)}
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                                        <div>
                                            <div className="text-sm font-semibold text-primary truncate max-w-24 sm:max-w-full">#{order.id.slice(-8).toUpperCase()}</div>
                                            <div className="text-xs text-muted-foreground">{order.date}</div>
                                        </div>
                                        <div className="hidden sm:block font-medium">₹{order.total.toFixed(2)}</div>
                                        <div className="col-span-1 flex justify-end sm:justify-start">
                                            <Badge
                                                variant={
                                                    order.status === 'Pending' ? 'destructive' :
                                                    order.status === 'Shipped' ? 'default' :
                                                    order.status === 'Delivered' ? 'secondary' :
                                                    'outline'
                                                }
                                                className="w-24 justify-center"
                                            >
                                                {order.status}
                                            </Badge>
                                        </div>
                                         <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="w-full sm:w-auto justify-self-end">View Details</Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-3xl">
                                                <DialogHeader>
                                                    <DialogTitle>Order Details</DialogTitle>
                                                    <DialogDescription>Order ID: #{order.id.slice(-8).toUpperCase()} placed on {order.date}</DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-6 py-4">
                                                    <div className="space-y-2">
                                                        <h4 className="font-semibold">Shipping Address</h4>
                                                        <address className="text-sm text-muted-foreground not-italic whitespace-pre-wrap">{order.shippingAddress}</address>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Items</h4>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="w-[80px] hidden sm:table-cell">Image</TableHead>
                                                                    <TableHead>Product</TableHead>
                                                                    <TableHead className="text-center">Quantity</TableHead>
                                                                    <TableHead className="text-right">Price</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {order.items.map((item, idx) => (
                                                                    <TableRow key={idx}>
                                                                        <TableCell className="hidden sm:table-cell">
                                                                            <Link href={`/products/${item.productId}`}>
                                                                                <Image src={item.imageUrl || 'https://placehold.co/80x80.png'} alt={item.productName} width={60} height={75} className="rounded-md object-cover" />
                                                                            </Link>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Link href={`/products/${item.productId}`} className="font-medium hover:underline">{item.productName}</Link>
                                                                            { (item.size || item.color) && <div className="text-xs text-muted-foreground">{item.size}{item.size && item.color && ' / '}{item.color}</div> }
                                                                        </TableCell>
                                                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                                                        <TableCell className="text-right font-medium">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                                <DialogFooter className="sm:justify-between items-center pt-4 border-t">
                                                    <div className="font-semibold text-lg">
                                                        Total: ₹{order.total.toFixed(2)}
                                                    </div>
                                                    {(() => {
                                                        const { cancellable, reason } = isOrderCancellable(order);
                                                        const buttonText = order.status === 'Delivered' ? 'Return Order' : 'Cancel Order';
                                                        if (cancellable) {
                                                            return (
                                                                <Button
                                                                    variant="destructive"
                                                                    onClick={() => setOrderToCancel(order)}
                                                                >
                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                    {buttonText}
                                                                </Button>
                                                            );
                                                        } else {
                                                            return (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <span tabIndex={0}>
                                                                                <Button
                                                                                    variant="destructive"
                                                                                    disabled
                                                                                    className="pointer-events-none"
                                                                                >
                                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                                    {buttonText}
                                                                                </Button>
                                                                            </span>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{reason}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            );
                                                        }
                                                    })()}
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        !error && (
                            <div className="text-center p-12 text-muted-foreground">
                                You have not placed any orders yet.
                            </div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
        
        <AlertDialog open={!!orderToCancel} onOpenChange={(open) => { if (!open) { setOrderToCancel(null); setCancellationReason(''); } }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will {orderToCancel?.status === 'Delivered' ? 'initiate a return for' : 'cancel'} your order <span className="font-semibold">#{orderToCancel?.id.slice(-6).toUpperCase()}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                    <Label htmlFor="cancellation-reason" className="text-sm font-medium">
                        Reason for {orderToCancel?.status === 'Delivered' ? 'Return' : 'Cancellation'} (Required)
                    </Label>
                    <Textarea
                        id="cancellation-reason"
                        placeholder="Tell us why you're making this request..."
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        className="mt-2"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => { setOrderToCancel(null); setCancellationReason(''); }} disabled={isCancelling}>Back</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleConfirmCancel} 
                        disabled={isCancelling || !cancellationReason} 
                        className={buttonVariants({ variant: "destructive" })}
                    >
                        {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isCancelling ? "Processing..." : `Confirm ${orderToCancel?.status === 'Delivered' ? 'Return' : 'Cancellation'}`}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
