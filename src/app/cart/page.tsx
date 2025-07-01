
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, ShoppingBag, Plus, Minus, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { createRazorpayOrder, verifyRazorpayPayment, saveOrder } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Order, OrderItem } from '@/types';

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const QuantityControl = ({ itemId, quantity }: { itemId: string, quantity: number }) => (
        <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(itemId, quantity - 1)}>
                <Minus className="h-4 w-4" />
            </Button>
            <Input
                type="number"
                value={quantity}
                onChange={(e) => updateQuantity(itemId, parseInt(e.target.value) || 0)}
                className="h-8 w-12 text-center"
                aria-label="Item quantity"
            />
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(itemId, quantity + 1)}>
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
    
    const handleCheckout = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'Please log in to proceed with checkout.' });
            router.push('/login');
            return;
        }

        if (cart.length === 0) {
            toast({ variant: 'destructive', title: 'Empty Cart', description: 'Your cart is empty.' });
            return;
        }

        if (cartTotal < 1) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'The total amount must be at least ₹1.00 to proceed.' });
            return;
        }

        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
            toast({ variant: 'destructive', title: 'Configuration Error', description: 'Payment gateway is not configured. Public key is missing.' });
            console.error('ERROR: NEXT_PUBLIC_RAZORPAY_KEY_ID is not set in your .env file.');
            return;
        }

        setIsProcessing(true);

        const orderResponse = await createRazorpayOrder(cartTotal);

        if ('error' in orderResponse) {
            toast({ variant: 'destructive', title: 'Payment Initialization Failed', description: orderResponse.error });
            setIsProcessing(false);
            return;
        }

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: orderResponse.amount,
            currency: orderResponse.currency,
            name: 'Acoof',
            description: 'Order Payment',
            order_id: orderResponse.id,
            handler: async function (response: any) {
                const verificationResult = await verifyRazorpayPayment({
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                });

                if (verificationResult.success) {
                    const orderItems: OrderItem[] = cart.map(item => ({
                        productId: item.id,
                        productName: item.name,
                        quantity: item.quantity,
                        price: item.price,
                    }));
                    
                    const orderData: Omit<Order, 'id'> = {
                        user: user.displayName || 'Anonymous',
                        userEmail: user.email || 'N/A',
                        date: new Date().toISOString().split('T')[0],
                        total: cartTotal,
                        status: 'Pending',
                        shippingAddress: user.address || 'Not provided',
                        items: orderItems,
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        paymentSignature: response.razorpay_signature,
                    };
                    
                    const saveResult = await saveOrder(orderData);
                    if (saveResult.success) {
                        toast({ title: 'Payment Successful', description: 'Your order has been placed!' });
                        clearCart();
                        router.push('/dashboard/user/orders');
                    } else {
                        toast({ variant: 'destructive', title: 'Order Error', description: saveResult.error });
                    }
                } else {
                    toast({ variant: 'destructive', title: 'Payment Failed', description: verificationResult.error || 'Unknown error during verification.' });
                }
                setIsProcessing(false);
            },
            prefill: {
                name: user.displayName || '',
                email: user.email || '',
                contact: user.phone || '',
            },
            theme: {
                color: '#FF9800',
            },
            modal: {
                ondismiss: function() {
                    setIsProcessing(false);
                    toast({ variant: 'destructive', title: 'Payment Cancelled', description: 'The payment process was not completed.' });
                }
            }
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
    };

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="text-left mb-12">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline">Your Cart</h1>
                <p className="max-w-2xl mt-4 text-muted-foreground">
                    Review your items and proceed to checkout.
                </p>
            </div>

            {cart.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-6 text-xl font-semibold">Your cart is empty</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Looks like you haven't added anything to your cart yet.
                    </p>
                    <Button asChild className="mt-6">
                        <Link href="/products">Start Shopping</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                    <div className="lg:col-span-2">
                        {/* Mobile View */}
                        <div className="sm:hidden space-y-4">
                            {cart.map((item) => (
                                <Card key={item.id} className="overflow-hidden">
                                    <CardContent className="p-4 flex gap-4">
                                        <div className="relative w-24 h-32 flex-shrink-0">
                                            <Image
                                                src={item.images[0] || 'https://placehold.co/100x125.png'}
                                                alt={item.name}
                                                fill
                                                className="rounded-md object-cover"
                                            />
                                        </div>
                                        <div className="flex-grow flex flex-col justify-between py-1">
                                            <div>
                                                <div className="font-medium leading-tight">{item.name}</div>
                                                <div className="text-sm text-muted-foreground">₹{(item.price * item.quantity).toFixed(2)}</div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <QuantityControl itemId={item.id} quantity={item.quantity} />
                                                <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden sm:block">
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px]">Image</TableHead>
                                                <TableHead>Product</TableHead>
                                                <TableHead className="text-center">Quantity</TableHead>
                                                <TableHead className="text-right">Price</TableHead>
                                                <TableHead className="w-[50px]">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cart.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <Image
                                                            src={item.images[0] || 'https://placehold.co/80x80.png'}
                                                            alt={item.name}
                                                            width={80}
                                                            height={80}
                                                            className="rounded-md object-cover"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{item.name}</div>
                                                        <div className="text-sm text-muted-foreground">{item.category}</div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <QuantityControl itemId={item.id} quantity={item.quantity} />
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="lg:col-span-1 sticky top-24">
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span>Subtotal ({cartCount} items)</span>
                                    <span>₹{cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span>Free</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>₹{cartTotal.toFixed(2)}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex-col gap-2">
                                <Button className="w-full" onClick={handleCheckout} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                                </Button>
                                <Button variant="outline" className="w-full" onClick={clearCart} disabled={isProcessing}>Clear Cart</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
