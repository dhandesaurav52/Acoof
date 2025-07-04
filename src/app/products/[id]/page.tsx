
'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useProducts } from '@/hooks/use-products';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Loader2, Heart, ShoppingCart, Star, CheckCircle, Zap } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/app/actions';
import type { Order, OrderItem } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { database } from '@/lib/firebase';
import { ref as dbRef, update, push } from 'firebase/database';

async function saveOrder(orderData: Omit<Order, 'id'>): Promise<{ success: boolean; error?: string; orderId?: string; }> {
    if (!database) {
        return { success: false, error: 'Firebase is not configured. Cannot save order.' };
    }

    if (!orderData.userId) {
        return { success: false, error: 'Cannot save order without a user ID.' };
    }
    
    const newOrderRef = push(dbRef(database, 'orders'));
    const newId = newOrderRef.key;

    if (!newId) {
        return { success: false, error: 'Failed to generate a unique order ID from Firebase.' };
    }
    
    const finalOrderData: Order = { ...orderData, id: newId };
    
    try {
        const updates: { [key: string]: any } = {};
        updates[`/orders/${newId}`] = finalOrderData;
        updates[`/users/${orderData.userId}/orders/${newId}`] = true;

        await update(dbRef(database), updates);
        return { success: true, orderId: newId };
    } catch (error: any) {
        let errorMessage = 'An unexpected error occurred while saving the order.';
        if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
            errorMessage = "Permission Denied: Please check your Firebase Realtime Database security rules to allow authenticated users to write to the 'orders' and their own 'users' data path.";
        }
        console.error("Firebase saveOrder error:", error);
        return { success: false, error: errorMessage };
    }
}

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { products, loading: productsLoading } = useProducts();
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { toast } = useToast();
    const { user } = useAuth();

    const [selectedColor, setSelectedColor] = useState<string | undefined>();
    const [selectedSize, setSelectedSize] = useState<string | undefined>();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCodProcessing, setIsCodProcessing] = useState(false);
    const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);

    const product = products.find(p => p.id === id);
    
    useEffect(() => {
        if (product) {
            if (product.colors && product.colors.length > 0 && !selectedColor) {
                setSelectedColor(product.colors[0]);
            }
            if (product.sizes && product.sizes.length > 0 && !selectedSize) {
                setSelectedSize(product.sizes[0]);
            }
        }
    }, [product, selectedColor, selectedSize]);

    if (productsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container mx-auto py-12 px-4 text-center">
                <h1 className="text-4xl font-bold tracking-tighter">Product Not Found</h1>
                <p className="mt-4 text-muted-foreground">The product you are looking for does not exist.</p>
            </div>
        );
    }

    const isFavorited = isInWishlist(product.id);

    const handleFavoriteClick = () => {
        if (isFavorited) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    const handleBuyNow = async () => {
        if (!product) return;
        
        if (product.price < 1) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'This product cannot be purchased as its price is less than ₹1.00.' });
            return;
        }

        if (!user) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'Please log in to buy this item.' });
            router.push('/login');
            return;
        }

        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
            toast({ variant: 'destructive', title: 'Configuration Error', description: 'Payment gateway is not configured. Public key is missing.' });
            console.error('ERROR: NEXT_PUBLIC_RAZORPAY_KEY_ID is not set in your .env file.');
            return;
        }

        setIsProcessing(true);

        const orderResponse = await createRazorpayOrder(product.price, `receipt_product_${product.id}`);

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
            description: `Payment for ${product.name}`,
            order_id: orderResponse.id,
            handler: async function (response: any) {
                const verificationResult = await verifyRazorpayPayment({
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                });

                if (verificationResult.success) {
                    const orderItem: OrderItem = {
                        productId: product.id,
                        productName: product.name,
                        quantity: 1,
                        price: product.price,
                    };
                    
                    const orderData: Omit<Order, 'id'> = {
                        userId: user.uid,
                        user: user.displayName || 'Anonymous',
                        userEmail: user.email || 'N/A',
                        date: new Date().toISOString().split('T')[0],
                        total: product.price,
                        status: 'Pending',
                        shippingAddress: user.address || 'Not provided',
                        items: [orderItem],
                        paymentMethod: 'Razorpay',
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        paymentSignature: response.razorpay_signature,
                    };
                    
                    const saveResult = await saveOrder(orderData);
                    if (saveResult.success) {
                        toast({ title: 'Payment Successful', description: 'Your order has been placed!' });
                        setIsBuyNowOpen(false);
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

    const handleCodBuyNow = async () => {
        if (!product) return;
        if (!user) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'Please log in to buy this item.' });
            router.push('/login');
            return;
        }
        
        setIsCodProcessing(true);
    
        const orderItem: OrderItem = {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            price: product.price,
        };
        
        const orderData: Omit<Order, 'id'> = {
            userId: user.uid,
            user: user.displayName || 'Anonymous',
            userEmail: user.email || 'N/A',
            date: new Date().toISOString().split('T')[0],
            total: product.price,
            status: 'Pending',
            shippingAddress: user.address || 'Not provided',
            items: [orderItem],
            paymentMethod: 'COD',
        };
        
        const saveResult = await saveOrder(orderData);
        if (saveResult.success) {
            toast({ title: 'Order Placed!', description: 'Your order for has been placed. You will pay upon delivery.' });
            setIsBuyNowOpen(false);
            router.push('/dashboard/user/orders');
        } else {
            toast({ variant: 'destructive', title: 'Order Error', description: saveResult.error });
        }
    
        setIsCodProcessing(false);
    };


    return (
        <div className="container mx-auto py-12 px-4">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
                {/* Image Carousel */}
                <div>
                    <Carousel className="w-full group">
                        <CarouselContent>
                            {product.images.map((image, index) => (
                                <CarouselItem key={index}>
                                    <Card className="overflow-hidden rounded-lg">
                                        <CardContent className="p-0 aspect-[4/5] relative">
                                            <Image
                                                src={image}
                                                alt={`${product.name} image ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                            />
                                        </CardContent>
                                    </Card>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                         {product.images.length > 1 && (
                            <>
                                <CarouselPrevious className="absolute left-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CarouselNext className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </>
                         )}
                    </Carousel>
                </div>

                {/* Product Details */}
                <div className="space-y-4 md:space-y-6">
                    <div>
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <Badge variant="secondary">{product.category}</Badge>
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter mt-2 font-headline">{product.name}</h1>
                            </div>
                             <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-full flex-shrink-0 ml-4"
                                onClick={handleFavoriteClick}
                                aria-label={isFavorited ? "Remove from Wishlist" : "Add to Wishlist"}
                            >
                                <Heart className={cn("h-6 w-6", isFavorited && "fill-primary text-primary")} />
                            </Button>
                        </div>
                        <p className="text-2xl md:text-3xl font-semibold text-primary mt-4">₹{product.price.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-0.5">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <Star className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span>(123 Reviews)</span>
                        </div>
                    </div>
                    
                    <Separator />

                    <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                    
                    {product.colors && product.colors.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Color: <span className="font-normal text-muted-foreground">{selectedColor}</span></h3>
                             <RadioGroup
                                value={selectedColor}
                                onValueChange={setSelectedColor}
                                className="flex flex-wrap gap-2"
                            >
                                {product.colors.map(color => (
                                    <Label key={color} htmlFor={`color-${color}`} className={cn(
                                        "cursor-pointer rounded-md border-2 px-4 py-2 text-sm transition-colors",
                                        selectedColor === color ? "border-primary text-primary bg-primary/10" : "border-input hover:border-primary/50"
                                    )}>
                                        <RadioGroupItem value={color} id={`color-${color}`} className="sr-only" />
                                        {color}
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>
                    )}

                    {product.sizes && product.sizes.length > 0 && (
                         <div className="space-y-4">
                            <h3 className="font-semibold">Size: <span className="font-normal text-muted-foreground">{selectedSize}</span></h3>
                            <RadioGroup
                                value={selectedSize}
                                onValueChange={setSelectedSize}
                                className="flex flex-wrap gap-2"
                            >
                                {product.sizes.map(size => (
                                     <Label key={size} htmlFor={`size-${size}`} className={cn(
                                        "cursor-pointer rounded-md border-2 px-4 py-2 text-sm transition-colors",
                                        selectedSize === size ? "border-primary text-primary bg-primary/10" : "border-input hover:border-primary/50"
                                    )}>
                                        <RadioGroupItem value={size} id={`size-${size}`} className="sr-only" />
                                        {size}
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>
                    )}


                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button size="lg" variant="outline" className="w-full" onClick={() => addToCart(product)} disabled={isProcessing || isCodProcessing}>
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Add to Cart
                        </Button>
                        <Dialog open={isBuyNowOpen} onOpenChange={setIsBuyNowOpen}>
                            <DialogTrigger asChild>
                                <Button size="lg" className="w-full" disabled={isProcessing || isCodProcessing}>
                                    <Zap className="mr-2 h-5 w-5" />
                                    Buy Now
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Confirm Purchase</DialogTitle>
                                    <DialogDescription>
                                        Choose your preferred payment method for "{product.name}".
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="flex justify-between items-center p-4 border rounded-lg">
                                        <div>
                                            <p className="font-semibold">Total Amount</p>
                                            <p className="text-2xl text-primary font-bold">₹{product.price.toFixed(2)}</p>
                                        </div>
                                        <div className="relative h-16 w-16">
                                            <Image src={product.images[0]} alt={product.name} fill className="rounded-md object-cover" />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="sm:justify-between gap-2">
                                    <Button className="w-full sm:w-auto" onClick={handleBuyNow} disabled={isProcessing || isCodProcessing}>
                                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {isProcessing ? 'Processing...' : 'Pay Online'}
                                    </Button>
                                    <Button variant="secondary" className="w-full sm:w-auto" onClick={handleCodBuyNow} disabled={isProcessing || isCodProcessing}>
                                        {isCodProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {isCodProcessing ? 'Placing Order...' : 'Cash on Delivery'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>In Stock - Ships within 2-3 business days.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
