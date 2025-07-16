
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, AlertCircle, Package, Search, FileText, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Order, OrderStatus, Product } from '@/types';
import { auth, database } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useProducts } from '@/hooks/use-products';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Separator } from '@/components/ui/separator';

const ADMIN_EMAIL = "admin@example.com";

export function AdminOrdersManager() {
    const { user, loading: authLoading } = useAuth();
    const { products, loading: productsLoading } = useProducts();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [productToShow, setProductToShow] = useState<Product | null>(null);

    useEffect(() => {
        if (authLoading) {
            return; // Wait for auth to resolve
        }
        if (!user || user.email !== ADMIN_EMAIL) {
            setLoadingData(false);
            return; // Not an admin, don't fetch
        }

        async function fetchOrders() {
            if (!database) {
                setError("Firebase is not configured correctly.");
                setLoadingData(false);
                return;
            }
            
            const ordersRef = ref(database, 'orders');
            try {
                const snapshot = await get(ordersRef);
                if (snapshot.exists()) {
                    const ordersData = snapshot.val();
                    const ordersList: Order[] = Object.keys(ordersData)
                        .map(key => ({ id: key, ...ordersData[key] }))
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setOrders(ordersList);
                } else {
                    setOrders([]);
                }
                setError(null);
            } catch (err: any) {
                console.error("Firebase read failed: ", err);
                if (err.code === 'PERMISSION_DENIED' || err.message?.includes('permission_denied')) {
                    setError("Permission Denied: Could not fetch orders. Please check that your Firebase Database rules grant read access to the '/orders' path for the admin email.");
                } else {
                    setError("An error occurred while fetching orders data.");
                }
            } finally {
                setLoadingData(false);
            }
        }

        fetchOrders();
    }, [user, authLoading]);
    
    const filteredOrders = useMemo(() => {
        if (!searchQuery) return orders;
        const lowercasedQuery = searchQuery.toLowerCase();
        return orders.filter(order => 
            order.id.toLowerCase().includes(lowercasedQuery) ||
            order.user.toLowerCase().includes(lowercasedQuery) ||
            order.userEmail.toLowerCase().includes(lowercasedQuery)
        );
    }, [orders, searchQuery]);

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        if (!database) return;

        const orderRef = ref(database, `orders/${orderId}`);
        try {
            await update(orderRef, { status: newStatus });
            // Manually update local state to reflect the change immediately
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId ? { ...order, status: newStatus } : order
                )
            );
        } catch (error: any) {
            if (error.code === 'PERMISSION_DENIED' && !auth?.currentUser) {
                console.warn("Order update permission denied, user may have logged out.");
                return;
            }
            console.error("Failed to update order status:", error);
        }
    };

    const getStatusIcon = (status: Order['status']) => {
        switch (status) {
            case 'Pending': return <Package className="h-5 w-5 text-yellow-500" />;
            case 'Shipped': return <Truck className="h-5 w-5 text-blue-500" />;
            case 'Delivered': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'Cancelled': return <XCircle className="h-5 w-5 text-red-500" />;
            default: return <FileText className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const handleProductClick = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            setProductToShow(product);
        }
    };
    
    if (authLoading || loadingData || productsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
                <div className="text-left">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter font-headline">Manage Orders</h1>
                    <p className="text-muted-foreground mt-2">
                        View, search, and update the status of all customer orders.
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
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="flex-1">
                                    <CardTitle>All Orders ({filteredOrders.length})</CardTitle>
                                    <CardDescription>A list of all orders placed in your store.</CardDescription>
                                </div>
                            </div>
                            <div className="relative mt-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder="Search by Order ID, Name, or Email..." 
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                {filteredOrders.length > 0 ? (
                                    <Accordion type="single" collapsible className="w-full">
                                        {filteredOrders.map((order) => (
                                            <AccordionItem value={order.id} key={order.id} className="last:border-b-0">
                                                <AccordionTrigger className="px-4 sm:px-6 py-4 hover:bg-muted/50 transition-colors text-left">
                                                    <div className="flex items-center gap-2 sm:gap-4 w-full">
                                                        <div className="hidden sm:block">
                                                            {getStatusIcon(order.status)}
                                                        </div>
                                                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                                                            <div>
                                                                <div className="text-sm font-semibold truncate max-w-24 sm:max-w-full" title={order.id}>{order.id}</div>
                                                                <div className="text-xs text-muted-foreground">{order.date}</div>
                                                            </div>
                                                            <div className="hidden sm:block">
                                                                <div className="font-medium">{order.user}</div>
                                                                <div className="text-xs text-muted-foreground truncate">{order.userEmail}</div>
                                                            </div>
                                                            <div className="col-span-1 flex justify-end sm:justify-start">
                                                                <Badge variant={order.status === 'Pending' ? 'destructive' : order.status === 'Shipped' ? 'default' : order.status === 'Delivered' ? 'secondary' : 'outline'} className="w-24 justify-center">{order.status}</Badge>
                                                            </div>
                                                            <div className="hidden sm:block text-right font-medium text-lg">₹{order.total.toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="bg-secondary/20">
                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <h4 className="font-semibold mb-2">Order Items ({order.items.length})</h4>
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Product</TableHead>
                                                                        <TableHead>Size</TableHead>
                                                                        <TableHead className="text-center">Qty</TableHead>
                                                                        <TableHead className="text-right">Subtotal</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {order.items.map((item, idx) => (
                                                                        <TableRow key={idx}>
                                                                            <TableCell>
                                                                                <button className="flex items-center gap-2 hover:underline text-left" onClick={() => handleProductClick(item.productId)}>
                                                                                    {item.imageUrl && (
                                                                                        <Image 
                                                                                            src={item.imageUrl} 
                                                                                            alt={item.productName} 
                                                                                            width={40} 
                                                                                            height={50} 
                                                                                            className="rounded-md object-cover"
                                                                                        />
                                                                                    )}
                                                                                    <span>{item.productName}{item.color && ` (${item.color})`}</span>
                                                                                </button>
                                                                            </TableCell>
                                                                            <TableCell>{item.size || '-'}</TableCell>
                                                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                                                            <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="font-semibold mb-1">Shipping & Payment</h4>
                                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.shippingAddress}</p>
                                                                <p className="text-sm mt-1">Payment Method: <span className="font-medium">{order.paymentMethod}</span></p>
                                                            </div>
                                                            {order.status === 'Cancelled' && order.cancellationReason && (
                                                                <div>
                                                                    <h4 className="font-semibold mb-1">Reason for Cancellation/Return</h4>
                                                                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border">{order.cancellationReason}</p>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <h4 className="font-semibold mb-2">Actions</h4>
                                                                <div className="flex items-center gap-2">
                                                                    <Select value={order.status} onValueChange={(value: OrderStatus) => handleStatusChange(order.id, value)}>
                                                                        <SelectTrigger className="w-full">
                                                                            <SelectValue placeholder="Update Status" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Pending">Pending</SelectItem>
                                                                            <SelectItem value="Shipped">Shipped</SelectItem>
                                                                            <SelectItem value="Delivered">Delivered</SelectItem>
                                                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                ) : (
                                    <div className="text-center h-48 flex flex-col items-center justify-center gap-2">
                                        <Package className="h-10 w-10 text-muted-foreground" />
                                        <p className="font-semibold">{orders.length > 0 ? "No orders match your search." : "No orders found."}</p>
                                        {orders.length > 0 && <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={!!productToShow} onOpenChange={(isOpen) => !isOpen && setProductToShow(null)}>
                {productToShow && (
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>{productToShow.name}</DialogTitle>
                            <DialogDescription>{productToShow.category}</DialogDescription>
                        </DialogHeader>
                        <div className="grid md:grid-cols-2 gap-6 py-4">
                            <Carousel className="w-full group">
                                <CarouselContent>
                                    {productToShow.images.map((image, index) => (
                                        <CarouselItem key={index}>
                                            <div className="aspect-[4/5] relative bg-secondary rounded-lg overflow-hidden">
                                                <Image
                                                    src={image}
                                                    alt={`${productToShow.name} image ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {productToShow.images.length > 1 && (
                                    <>
                                        <CarouselPrevious className="absolute left-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CarouselNext className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </>
                                )}
                            </Carousel>
                            <div className="space-y-4">
                                <p className="text-2xl font-semibold text-primary">₹{productToShow.price.toFixed(2)}</p>
                                <p className="text-muted-foreground text-sm">{productToShow.description}</p>
                                <Separator />
                                <div>
                                    <h4 className="text-sm font-semibold">Colors</h4>
                                    <p className="text-sm text-muted-foreground">{productToShow.colors?.join(', ') || 'N/A'}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold">Sizes</h4>
                                    <p className="text-sm text-muted-foreground">{productToShow.sizes?.join(', ') || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </>
    );
}

    