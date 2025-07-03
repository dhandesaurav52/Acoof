
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, FileText, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Order } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/lib/firebase';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';


export default function UserOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

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

  return (
    <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-left">
                <h1 className="text-4xl font-bold tracking-tighter font-headline">My Orders</h1>
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
                                    <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors text-left">
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="hidden sm:block">
                                               {getStatusIcon(order.status)}
                                            </div>
                                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                                                <div>
                                                    <div className="font-bold truncate max-w-24 sm:max-w-full">{order.id}</div>
                                                    <div className="text-xs text-muted-foreground">{order.date}</div>
                                                </div>
                                                <div className="hidden sm:block text-right sm:text-left">₹{order.total.toFixed(2)}</div>
                                                <div className="col-span-2 sm:col-span-1 flex justify-end sm:justify-start">
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
    </div>
  );
}
