
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, ShoppingBag, Plus, Minus, Loader2, Edit, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { createRazorpayOrder, verifyRazorpayPayment, saveOrderToDatabase } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import type { Order, OrderItem } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart } = useCart();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCodProcessing, setIsCodProcessing] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    const [shippingAddressOption, setShippingAddressOption] = useState<'default' | 'new'>('default');
    const [newAddress, setNewAddress] = useState({
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: ''
    });

    const isNewAddressValid = useMemo(() => {
        return newAddress.address.trim() && newAddress.city.trim() && newAddress.state.trim() && newAddress.pincode.trim() && newAddress.phone.trim();
    }, [newAddress]);
    
    const isCheckoutDisabled = useMemo(() => {
        if (isProcessing || isCodProcessing || isFetchingLocation) return true;
        // User must be loaded to check address
        if (authLoading || !user) return true;
        if (shippingAddressOption === 'default') return !user?.address || !user?.phone;
        if (shippingAddressOption === 'new') return !isNewAddressValid;
        return true;
    }, [isProcessing, isCodProcessing, shippingAddressOption, user, authLoading, isNewAddressValid, isFetchingLocation]);

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
                setNewAddress(prev => ({
                  ...prev,
                  address: address,
                  city: getAddressComponent('locality'),
                  state: getAddressComponent('administrative_area_level_1'),
                  pincode: getAddressComponent('postal_code'),
                }));
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

    const getFinalShippingAddress = (): string | null => {
        if (shippingAddressOption === 'new') {
            if (!isNewAddressValid) {
                toast({ variant: 'destructive', title: 'Address Incomplete', description: 'Please fill all fields for the new shipping address, including phone number.' });
                return null;
            }
            return `${newAddress.address}, ${newAddress.city}, ${newAddress.state} ${newAddress.pincode}\nPhone: ${newAddress.phone}`;
        }
        
        if (!user?.address || !user?.phone) {
            toast({ variant: 'destructive', title: 'Address or Phone Missing', description: 'Please add a shipping address and phone number to your profile before proceeding.' });
            return null;
        }
        return `${user.address}, ${user.city}, ${user.state} ${user.pincode}\nPhone: ${user.phone}`;
    };
    
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

        const finalShippingAddress = getFinalShippingAddress();
        if (!finalShippingAddress) return;

        if (cartTotal < 1) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'The total amount must be at least ₹1.00 to proceed.' });
            return;
        }

        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
            toast({ variant: 'destructive', title: 'Configuration Error', description: 'Payment gateway is not configured. Public key is missing. Please add NEXT_PUBLIC_RAZORPAY_KEY_ID to your .env file.' });
            return;
        }

        setIsProcessing(true);

        const idToken = await user.getIdToken();
        const orderResponse = await createRazorpayOrder(cartTotal, idToken);

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
                        userId: user.uid,
                        user: user.displayName || 'Anonymous',
                        userEmail: user.email || 'N/A',
                        date: new Date().toISOString().split('T')[0],
                        total: cartTotal,
                        status: 'Pending',
                        shippingAddress: finalShippingAddress,
                        items: orderItems,
                        paymentMethod: 'Razorpay',
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        paymentSignature: response.razorpay_signature,
                    };
                    
                    const saveResult = await saveOrderToDatabase(orderData, await user.getIdToken());
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

    const handleCodCheckout = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'Please log in to proceed with checkout.' });
            router.push('/login');
            return;
        }
        if (cart.length === 0) {
            toast({ variant: 'destructive', title: 'Empty Cart', description: 'Your cart is empty.' });
            return;
        }

        const finalShippingAddress = getFinalShippingAddress();
        if (!finalShippingAddress) return;
    
        setIsCodProcessing(true);
    
        const orderItems: OrderItem[] = cart.map(item => ({
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
        }));
        
        const orderData: Omit<Order, 'id'> = {
            userId: user.uid,
            user: user.displayName || 'Anonymous',
            userEmail: user.email || 'N/A',
            date: new Date().toISOString().split('T')[0],
            total: cartTotal,
            status: 'Pending',
            shippingAddress: finalShippingAddress,
            items: orderItems,
            paymentMethod: 'COD',
        };
        
        const saveResult = await saveOrderToDatabase(orderData, await user.getIdToken());
        if (saveResult.success) {
            toast({ title: 'Order Placed!', description: 'Your order has been placed successfully. You will pay upon delivery.' });
            clearCart();
            router.push('/dashboard/user/orders');
        } else {
            toast({ variant: 'destructive', title: 'Order Error', description: saveResult.error });
        }
        setIsCodProcessing(false);
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
                                    <CardContent className="p-3 flex gap-3">
                                        <div className="relative w-20 h-28 flex-shrink-0">
                                            <Image
                                                src={item.images[0] || 'https://placehold.co/100x125.png'}
                                                alt={item.name}
                                                fill
                                                className="rounded-md object-cover"
                                            />
                                        </div>
                                        <div className="flex-grow flex flex-col justify-between py-1">
                                            <div>
                                                <div className="text-sm font-medium leading-tight">{item.name}</div>
                                                <div className="text-sm text-muted-foreground">₹{(item.price * item.quantity).toFixed(2)}</div>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
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
                                <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full">
                                            Proceed to Checkout
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Confirm Order</DialogTitle>
                                            <DialogDescription>
                                                Confirm your shipping details and payment method.
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
                                                    {user?.address && user?.phone ? (
                                                        <address className="text-sm text-muted-foreground not-italic pl-6 whitespace-pre-wrap">
                                                            <p className="font-medium text-foreground">{user.displayName}</p>
                                                            <p>{user.address}, {user.city}, {user.state} {user.pincode}</p>
                                                            <p>Phone: {user.phone}</p>
                                                        </address>
                                                    ) : (
                                                        <div className="text-sm text-destructive pl-6">
                                                            No default address and/or phone number found. Please add them in your profile.
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
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Input id="pincode" placeholder="Pincode" value={newAddress.pincode} onChange={handleNewAddressChange} />
                                                                <Input id="phone" placeholder="Phone Number" value={newAddress.phone} onChange={handleNewAddressChange} />
                                                            </div>
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
                                                    <p className="text-2xl text-primary font-bold">₹{cartTotal.toFixed(2)}</p>
                                                </div>
                                                <p className="text-muted-foreground">{cartCount} items</p>
                                            </div>
                                        </div>
                            
                                        <DialogFooter className="sm:justify-between gap-2">
                                            <Button className="w-full sm:w-auto" onClick={handleCheckout} disabled={isCheckoutDisabled}>
                                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                {isProcessing ? 'Processing...' : 'Pay Online'}
                                            </Button>
                                            <Button variant="secondary" className="w-full sm:w-auto" onClick={handleCodCheckout} disabled={isCheckoutDisabled}>
                                                {isCodProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                {isCodProcessing ? 'Placing Order...' : 'Cash on Delivery'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Button variant="outline" className="w-full" onClick={clearCart} disabled={isProcessing || isCodProcessing}>Clear Cart</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
