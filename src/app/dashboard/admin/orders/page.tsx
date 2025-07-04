
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, AlertCircle, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Order, OrderStatus } from '@/types';
import { database } from '@/lib/firebase';
import { ref, onValue, off, update } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = "admin@example.com";

export default function AdminOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [authStatus, setAuthStatus] = useState<'loading' | 'unauthorized' | 'authorized'>('loading');

    // Stage 1: Authorize User
    useEffect(() => {
        if (authLoading) {
            setAuthStatus('loading');
            return;
        }
        if (!user) {
            setAuthStatus('unauthorized');
            router.push('/login');
            return;
        }
        if (user.email !== ADMIN_EMAIL) {
            setAuthStatus('unauthorized');
            router.push('/dashboard/user');
            return;
        }
        setAuthStatus('authorized');
    }, [user, authLoading, router]);

    // Stage 2: Fetch Data (only if authorized)
    useEffect(() => {
        if (authStatus !== 'authorized') {
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
            if (database) {
                off(ordersRef, 'value', listener);
            }
        };
    }, [authStatus]);

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
            if (error.code === 'PERMISSION_DENIED') {
                console.warn("Order update permission denied, likely due to logout.");
                return;
            }
            console.error("Failed to update order status:", error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'An unexpected error occurred while updating the order status.',
            });
        }
    };
    
    if (authStatus !== 'authorized') {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
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
                            <CardTitle>All Orders</CardTitle>
                            <CardDescription>A list of all orders placed in your store.</CardDescription>
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
                                                <TableCell className="text-center">
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
        </div>
    );
}
