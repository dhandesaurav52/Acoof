
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

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart } = useCart();

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
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px] hidden sm:table-cell">Image</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-center">Quantity</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="w-[50px]">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cart.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="hidden sm:table-cell">
                                                    <Image
                                                        src={item.images[0] || 'https://placehold.co/100x100.png'}
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
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                                                            className="h-8 w-12 text-center"
                                                        />
                                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">${(item.price * item.quantity).toFixed(2)}</TableCell>
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

                    <div className="lg:col-span-1 sticky top-24">
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span>Subtotal ({cartCount} items)</span>
                                    <span>${cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span>Free</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>${cartTotal.toFixed(2)}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex-col gap-2">
                                <Button className="w-full">Proceed to Checkout</Button>
                                <Button variant="outline" className="w-full" onClick={clearCart}>Clear Cart</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
