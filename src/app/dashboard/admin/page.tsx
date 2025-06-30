
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { BarChart, Package, ShoppingCart, Users, Loader2, UserCircle, Mail, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Order, OrderStatus } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const initialOrders: Order[] = [
    { 
        id: 'ORD012', 
        user: 'Liam Johnson', 
        userEmail: 'liam@example.com',
        date: '2023-10-27', 
        total: 325.00, 
        status: 'Pending',
        shippingAddress: '123 Maple St, Springfield, IL 62704',
        items: [
            { productId: 1, productName: 'Classic White Tee', quantity: 2, price: 25.00 },
            { productId: 4, productName: 'Urban Graphic Hoodie', quantity: 1, price: 65.00 },
            { productId: 2, productName: 'Slim-Fit Denim Jeans', quantity: 1, price: 75.00 },
            { productId: 3, productName: 'Leather Derby Shoes', quantity: 1, price: 120.00 },
        ]
    },
    { 
        id: 'ORD011', 
        user: 'Olivia Smith', 
        userEmail: 'olivia@example.com',
        date: '2023-10-26', 
        total: 150.00, 
        status: 'Shipped',
        shippingAddress: '456 Oak Ave, Metropolis, NY 10001',
        items: [
            { productId: 2, productName: 'Slim-Fit Denim Jeans', quantity: 2, price: 75.00 },
        ]
    },
    { 
        id: 'ORD010', 
        user: 'Noah Williams', 
        userEmail: 'noah@example.com',
        date: '2023-10-25', 
        total: 350.00, 
        status: 'Delivered',
        shippingAddress: '789 Pine Ln, Gotham, NJ 07001',
        items: [
            { productId: 7, productName: 'Linen Button-Up Shirt', quantity: 2, price: 55.00 },
            { productId: 5, productName: 'Cargo Trousers', quantity: 3, price: 80.00 },
        ]
    },
    { 
        id: 'ORD009', 
        user: 'Emma Brown', 
        userEmail: 'emma@example.com',
        date: '2023-10-24', 
        total: 450.00, 
        status: 'Delivered',
        shippingAddress: '321 Birch Rd, Star City, CA 90210',
        items: [
            { productId: 6, productName: 'Minimalist Sneakers', quantity: 5, price: 90.00 },
        ]
    },
    { 
        id: 'ORD008', 
        user: 'Ava Jones', 
        userEmail: 'ava@example.com',
        date: '2023-10-23', 
        total: 55.00, 
        status: 'Cancelled',
        shippingAddress: '654 Cedar Blvd, Central City, MO 63101',
        items: [
             { productId: 7, productName: 'Linen Button-Up Shirt', quantity: 1, price: 55.00 },
        ]
    },
];

const ADMIN_EMAIL = "admin@example.com";

export default function AdminDashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
    const [updatedStatus, setUpdatedStatus] = useState<OrderStatus | null>(null);

    useEffect(() => {
        if (loading) return; // Wait until loading is finished

        if (!user) {
            router.push('/login');
        } else if (user.email !== ADMIN_EMAIL) {
            router.push('/dashboard/user');
        }
    }, [user, loading, router]);
    
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
                        <div className="text-2xl font-bold">$45,231.89</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2350</div>
                        <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12,234</div>
                        <p className="text-xs text-muted-foreground">+19% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products in Stock</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">573</div>
                        <p className="text-xs text-muted-foreground">2 products need restocking</p>
                    </CardContent>
                </Card>
            </div>
            
            {/* Recent Orders Table */}
            <Card>
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
                        {orders.map((order) => (
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
                        ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>

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
    </>
  );
}
