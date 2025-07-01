
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createRazorpayOrder } from '@/app/actions';

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart } = useCart();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();

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
        if (cart.length === 0) return;

        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!keyId) {
            toast({
                variant: 'destructive',
                title: 'Payment Gateway Error',
                description: 'Payment gateway is not configured. Please contact support.',
            });
            return;
        }

        const response = await createRazorpayOrder(cartTotal);

        if (!response.success || !response.order) {
            toast({
                variant: "destructive",
                title: "Payment Error",
                description: response.error || "Could not initiate payment.",
            });
            return;
        }
    
        const order = response.order;
    
        const options = {
            key: keyId,
            amount: order.amount,
            currency: order.currency,
            name: "Acoof",
            description: `Payment for ${cartCount} items`,
            order_id: order.id,
            handler: function (response: any) {
                toast({
                    title: "Payment Successful!",
                    description: `Payment ID: ${response.razorpay_payment_id}`,
                });
                clearCart();
                router.push('/dashboard/user/orders');
            },
            prefill: {
                name: user?.displayName || "",
                email: user?.email || "",
                contact: user?.phone || "",
            },
            notes: {
                address: user?.address || "Acoof - Style Redefined",
                productIds: cart.map(item => item.id).join(', '),
            },
            theme: {
                color: "#e53935",
            },
        };
    
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
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
                                <Button className="w-full" onClick={handleCheckout}>Proceed to Checkout</Button>
                                <Button variant="outline" className="w-full" onClick={clearCart}>Clear Cart</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
