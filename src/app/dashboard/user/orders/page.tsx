
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, FileText, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Order, OrderStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/lib/firebase';
import { ref, query, orderByChild, equalTo, get, update } from 'firebase/database';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export default function UserOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

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
            const ordersRef = ref(database, 'orders');
            const userOrdersQuery = query(ordersRef, orderByChild('userId'), equalTo(user.uid));
            
            try {
                const snapshot = await get(userOrdersQuery);
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
                console.error('Failed to fetch user orders:', error);
                let desc = 'An error occurred while fetching your orders.';
                if (error.code === 'PERMISSION_DENIED') {
                    desc = "Permission denied. Check your Firebase security rules."
                }
                toast({
                    variant: 'destructive',
                    title: 'Failed to fetch orders',
                    description: desc,
                });
            }
            setLoading(false);
        }

        if (user) {
            fetchUserOrders();
        }
    }, [user, toast]);
    
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

    const handleConfirmCancel = async () => {
        if (!orderToCancel || !database) return;
        setIsCancelling(true);
        const orderRef = ref(database, `orders/${orderToCancel.id}`);
        try {
            await update(orderRef, { status: 'Cancelled' });
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderToCancel.id ? { ...order, status: 'Cancelled' as OrderStatus } : order
                )
            );
            toast({ title: "Order Cancelled", description: "Your order has been successfully cancelled." });
        } catch (error: any) {
            console.error('Failed to cancel order:', error);
            let desc = 'An error occurred while cancelling your order.';
            if (error.code === 'PERMISSION_DENIED') {
                desc = "Permission denied. Please check your Firebase security rules."
            }
            toast({
                variant: 'destructive',
                title: 'Cancellation Failed',
                description: desc,
            });
        } finally {
            setIsCancelling(false);
            setOrderToCancel(null);
        }
    };

  return (
    <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-left">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter font-headline">My Orders</h1>
                <p className="text-muted-foreground mt-2">
                    Track your purchase history and order status.
                </p>
            </div>

            <Card>
                <CardContent className="p-0">
                    {orders.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {orders.map((order) => (
                                <AccordionItem value={order.id} key={order.id}>
                                    <AccordionTrigger className="px-4 sm:px-6 py-4 hover:bg-muted/50 transition-colors text-left">
                                        <div className="flex items-center gap-2 sm:gap-4 w-full">
                                            <div className="hidden sm:block">
                                               {getStatusIcon(order.status)}
                                            </div>
                                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                                                <div>
                                                    <div className="text-sm font-semibold truncate max-w-24 sm:max-w-full">{order.id}</div>
                                                    <div className="text-xs text-muted-foreground">{order.date}</div>
                                                </div>
                                                <div className="hidden sm:block text-right sm:text-left font-medium">₹{order.total.toFixed(2)}</div>
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
                                                <div className="hidden sm:block text-right text-muted-foreground">{order.items.length} item(s)</div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="bg-secondary/20">
                                        <div className="p-6">
                                            <h4 className="font-semibold mb-4 text-lg">Order Details</h4>
                                             <div className="mb-6 space-y-2">
                                                <p><span className="font-semibold">Shipping Address:</span> {order.shippingAddress}</p>
                                             </div>
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
                                                    {order.items.map(item => (
                                                        <TableRow key={item.productId}>
                                                            <TableCell className="font-medium">{item.productName}</TableCell>
                                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                                            <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right font-medium">₹{(item.quantity * item.price).toFixed(2)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            <div className="mt-6 flex justify-end">
                                                {order.status === 'Pending' ? (
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => setOrderToCancel(order)}
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        Cancel Order
                                                    </Button>
                                                ) : (
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
                                                                        Cancel Order
                                                                    </Button>
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>This order cannot be cancelled as its status is '{order.status}'.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center p-12 text-muted-foreground">
                            You have not placed any orders yet.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        
        <AlertDialog open={!!orderToCancel} onOpenChange={(open) => { if (!open) setOrderToCancel(null); }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will cancel your order <span className="font-semibold">#{orderToCancel?.id}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setOrderToCancel(null)} disabled={isCancelling}>Back</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleConfirmCancel} 
                        disabled={isCancelling} 
                        className={buttonVariants({ variant: "destructive" })}
                    >
                        {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
