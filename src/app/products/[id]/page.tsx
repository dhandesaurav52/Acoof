 'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useProducts } from '@/hooks/use-products';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Loader2, Heart, ShoppingCart, Star, CheckCircle, Zap, Edit, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/app/actions';
import type { Order, OrderItem, Product } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { database } from '@/lib/firebase';
import { ref as dbRef, update, push } from 'firebase/database';
import { ProductCard } from '@/components/ProductCard';

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

        // Add notification for admin
        const notificationMessage = `New order #${newId} placed by ${orderData.userEmail}. Total: ₹${orderData.total.toFixed(2)}`;
        const newNotificationRef = push(dbRef(database, 'notifications'));
        updates[`/notifications/${newNotificationRef.key}`] = {
            type: 'new_order',
            message: notificationMessage,
            timestamp: new Date().toISOString(),
            read: false,
            orderId: newId,
            userId: orderData.userId,
            userEmail: orderData.userEmail,
        };

        await update(dbRef(database), updates);
        return { success: true, orderId: newId };
    } catch (error: any) {
        let errorMessage = 'An unexpected error occurred while saving the order.';
        if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission_denied')) {
            errorMessage = "Permission Denied: Please check your Firebase Realtime Database security rules to allow authenticated users to write to the 'orders', their own 'users' data path, and the 'notifications' path.";
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
    
    const [isClient, setIsClient] = useState(false);
    const [selectedColor, setSelectedColor] = useState<string | undefined>();
    const [selectedSize, setSelectedSize] = useState<string | undefined>();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCodProcessing, setIsCodProcessing] = useState(false);
    const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    
    const [shippingAddressOption, setShippingAddressOption] = useState<'default' | 'new'>('default');
    const [newAddress, setNewAddress] = useState({
        address: '',
        city: '',
        state: '',
        pincode: ''
    });

    useEffect(() => {
        setIsClient(true);
    }, []);

    const product = useMemo(() => products.find(p => p.id === id), [products, id]);

    const relatedProducts = useMemo(() => {
        if (!product || !products.length) return [];
    
        const categoryMap: Record<Product['category'], Product['category'][]> = {
            'Tshirts': ['Jeans', 'Pants', 'Shoes', 'Bags', 'Belts'],
            'Oversized T-shirt': ['Jeans', 'Trousers', 'Shoes', 'Belts', 'Track pants'],
            'Shirts': ['Trousers', 'Jeans', 'Shoes', 'Belts', 'Pants'],
            'Sweater': ['Jeans', 'Pants', 'Shoes', 'Trousers'],
            'Sweatshirt': ['Track pants', 'Jeans', 'Shoes', 'Bags'],
            'Jackets': ['Tshirts', 'Jeans', 'Pants', 'Shoes', 'Sweatshirt'],
            'Jeans': ['Tshirts', 'Shirts', 'Shoes', 'Belts', 'Sweatshirt', 'Jackets'],
            'Pants': ['Tshirts', 'Shirts', 'Shoes', 'Belts', 'Sweater'],
            'Trousers': ['Shirts', 'Shoes', 'Belts', 'Sweater'],
            'Track pants': ['Sweatshirt', 'Tshirts', 'Shoes'],
            'Shoes': ['Socks', 'Jeans', 'Pants', 'Trousers', 'Track pants'],
            'Bags': ['Tshirts', 'Wallets', 'Jackets', 'Jeans'],
            'Belts': ['Jeans', 'Pants', 'Trousers'],
            'Socks': ['Shoes', 'Track pants'],
            'Wallets': ['Bags', 'Jeans'],
        };
    
        const relatedCategories = categoryMap[product.category] || [];
        
        const recommended = products.filter(p => 
            p.id !== product.id && relatedCategories.includes(p.category)
        );
        
        const shuffled = recommended.sort(() => 0.5 - Math.random());
        
        return shuffled.slice(0, 8);
    
    }, [product, products]);

    const isNewAddressValid = useMemo(() => {
        return newAddress.address.trim() && newAddress.city.trim() && newAddress.state.trim() && newAddress.pincode.trim();
    }, [newAddress]);

    const isCheckoutDisabled = useMemo(() => {
        if (isProcessing || isCodProcessing || isFetchingLocation) return true;
        if (shippingAddressOption === 'default') return !user?.address;
        if (shippingAddressOption === 'new') return !isNewAddressValid;
        return true;
    }, [isProcessing, isCodProcessing, shippingAddressOption, user?.address, isNewAddressValid, isFetchingLocation]);

    const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setNewAddress(prev => ({ ...prev, [id]: value }));
    };

    const handleCurrentLocation = () => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            toast({
                variant: 'destructive',
                title: 'Configuration Error',
                description: 'The Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file.',
            });
            return;
        }
        if (!navigator.geolocation) {
          toast({
            variant: 'destructive',
            title: 'Geolocation Not Supported',
            description: 'Your browser does not support this feature.',
          });
          return;
        }
        setIsFetchingLocation(true);
        toast({
          title: 'Fetching Location',
          description: 'Please grant permission to access your location.',
        });
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
              );
              const data = await response.json();
              if (data.status === 'OK' && data.results[0]) {
                const address = data.results[0].formatted_address;
                const addressComponents = data.results[0].address_components;
                const getAddressComponent = (type: string) => addressComponents.find((c: any) => c.types.includes(type))?.long_name || '';
                setNewAddress({
                  address: address,
                  city: getAddressComponent('locality'),
                  state: getAddressComponent('administrative_area_level_1'),
                  pincode: getAddressComponent('postal_code'),
                });
                toast({
                  title: 'Location Updated',
                  description: 'Your address has been populated.',
                });
              } else {
                  let errorMessage = `Geocoding failed: ${data.status}`;
                  if (data.error_message) {
                      errorMessage = `Geocoding API error: "${data.error_message}". Please check your API key and Google Cloud project settings.`;
                  }
                  toast({
                    variant: 'destructive',
                    title: 'Could Not Fetch Address',
                    description: errorMessage,
                  });
              }
            } catch (error: any) {
              toast({
                variant: 'destructive',
                title: 'Network Error',
                description: 'Could not connect to the Geocoding service.',
              });
            } finally {
                setIsFetchingLocation(false);
            }
          },
          (error) => {
            let message = 'An unknown error occurred.';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                message = 'You denied the request for Geolocation.';
                break;
              case error.POSITION_UNAVAILABLE:
                message = 'Location information is unavailable.';
                break;
              case error.TIMEOUT:
                message = 'The request to get user location timed out.';
                break;
            }
            toast({
              variant: 'destructive',
              title: 'Geolocation Error',
              description: message,
            });
            setIsFetchingLocation(false);
          }
        );
    };
    
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

    if (!isClient || productsLoading) {
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
    
    const getFinalShippingAddress = (): string | null => {
        if (shippingAddressOption === 'new') {
            if (!isNewAddressValid) {
                toast({ variant: 'destructive', title: 'Address Incomplete', description: 'Please fill all fields for the new shipping address.' });
                return null;
            }
            return `${newAddress.address}, ${newAddress.city}, ${newAddress.state} ${newAddress.pincode}`;
        }
        
        if (!user?.address) {
            toast({ variant: 'destructive', title: 'Address Missing', description: 'Please add a shipping address to your profile before proceeding.' });
            return null;
        }
        return user.address;
    };


    const handleBuyNow = async () => {
        if (!product) return;

        if (!user) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'Please log in to buy this item.' });
            router.push('/login');
            return;
        }
        
        const finalShippingAddress = getFinalShippingAddress();
        if (!finalShippingAddress) return;
        
        if (product.price < 1) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'This product cannot be purchased as its price is less than ₹1.00.' });
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
            name: 'Urban Attire',
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
                        shippingAddress: finalShippingAddress,
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

        const finalShippingAddress = getFinalShippingAddress();
        if (!finalShippingAddress) return;
        
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
            shippingAddress: finalShippingAddress,
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
                                        Confirm your shipping details for "{product.name}".
                                    </DialogDescription>
                                </DialogHeader>
                                 <div className="space-y-4 py-4">
                                    <RadioGroup value={shippingAddressOption} onValueChange={(value) => setShippingAddressOption(value as 'default' | 'new')} className="space-y-2">
                                        <div className="p-4 border rounded-lg space-y-2 has-[:checked]:bg-secondary/50 has-[:checked]:border-primary">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="default-address" className="font-semibold flex items-center gap-2 cursor-pointer">
                                                    <RadioGroupItem value="default" id="default-address" />
                                                    Use Default Address
                                                </Label>
                                                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/user')}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Change
                                                </Button>
                                            </div>
                                            {user?.address ? (
                                                <address className="text-sm text-muted-foreground not-italic pl-6">
                                                    <p className="font-medium text-foreground">{user.displayName}</p>
                                                    <p>{user.address}</p>
                                                    <p>{user.city}, {user.state} {user.pincode}</p>
                                                    <p>{user.phone}</p>
                                                </address>
                                            ) : (
                                                <div className="text-sm text-destructive pl-6">
                                                    No default address found. Please add one in your profile.
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 border rounded-lg space-y-2 has-[:checked]:bg-secondary/50 has-[:checked]:border-primary">
                                                <Label htmlFor="new-address" className="font-semibold flex items-center gap-2 cursor-pointer">
                                                <RadioGroupItem value="new" id="new-address" />
                                                Ship to a New Address
                                            </Label>
                                            {shippingAddressOption === 'new' && (
                                                <div className="space-y-2 pl-6 pt-2">
                                                    <Input id="address" placeholder="Street Address" value={newAddress.address} onChange={handleNewAddressChange} />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Input id="city" placeholder="City" value={newAddress.city} onChange={handleNewAddressChange} />
                                                        <Input id="state" placeholder="State" value={newAddress.state} onChange={handleNewAddressChange} />
                                                    </div>
                                                    <Input id="pincode" placeholder="Pincode" value={newAddress.pincode} onChange={handleNewAddressChange} />
                                                    <div className="flex justify-end pt-1">
                                                        <Button variant="link" size="sm" onClick={handleCurrentLocation} type="button" className="p-0 h-auto text-sm text-primary" disabled={isFetchingLocation}>
                                                            {isFetchingLocation ? (
                                                                <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Fetching...
                                                                </>
                                                            ) : (
                                                                <>
                                                                <MapPin className="mr-2 h-4 w-4" />
                                                                Use current location
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </RadioGroup>
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
                                    <Button className="w-full sm:w-auto" onClick={handleBuyNow} disabled={isCheckoutDisabled}>
                                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {isProcessing ? 'Processing...' : 'Pay Online'}
                                    </Button>
                                    <Button variant="secondary" className="w-full sm:w-auto" onClick={handleCodBuyNow} disabled={isCheckoutDisabled}>
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

            {relatedProducts.length > 0 && (
                <div className="mt-20 md:mt-28">
                    <h2 className="text-3xl font-bold tracking-tighter font-headline mb-8">You Might Also Like</h2>
                    <Carousel
                        opts={{
                            align: "start",
                            loop: relatedProducts.length > 4,
                        }}
                        className="w-full"
                    >
                        <CarouselContent>
                            {relatedProducts.map((relatedProduct) => (
                                <CarouselItem key={relatedProduct.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                    <div className="p-1">
                                        <ProductCard product={relatedProduct} />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden sm:flex" />
                        <CarouselNext className="hidden sm:flex" />
                    </Carousel>
                </div>
            )}
        </div>
    );
}
