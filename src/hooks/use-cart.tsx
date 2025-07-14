
'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { Product, CartItem } from '@/types';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
    loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();

    const getCartKey = useCallback((user: any) => {
        return user ? `urban-attire-cart-${user.uid}` : 'urban-attire-cart-guest';
    }, []);

    // Effect to load cart from localStorage on initial load and when user changes
    useEffect(() => {
        if (authLoading) {
            return; // Wait for auth state to be resolved
        }

        const currentCartKey = getCartKey(user);
        
        try {
            // Handle user login: merge guest cart with user cart
            if (user) {
                const guestCartKey = 'urban-attire-cart-guest';
                const guestCartRaw = localStorage.getItem(guestCartKey);
                const guestCart: CartItem[] = guestCartRaw ? JSON.parse(guestCartRaw) : [];

                const userCartRaw = localStorage.getItem(currentCartKey);
                const userCart: CartItem[] = userCartRaw ? JSON.parse(userCartRaw) : [];
                
                if (guestCart.length > 0) {
                    const mergedCart = [...userCart];
                    guestCart.forEach(guestItem => {
                        const existingItemIndex = mergedCart.findIndex(userItem => userItem.id === guestItem.id);
                        if (existingItemIndex > -1) {
                            mergedCart[existingItemIndex].quantity += guestItem.quantity;
                        } else {
                            mergedCart.push(guestItem);
                        }
                    });
                    setCart(mergedCart);
                    localStorage.setItem(currentCartKey, JSON.stringify(mergedCart));
                    localStorage.removeItem(guestCartKey); // Clear guest cart after merge
                    toast({ title: "Cart Merged", description: "Your guest cart items have been added to your account." });
                } else {
                    setCart(userCart);
                }
            } else {
                // Handle logout or guest user
                const savedCartRaw = localStorage.getItem(currentCartKey);
                const savedCart = savedCartRaw ? JSON.parse(savedCartRaw) : [];
                setCart(savedCart);
            }
        } catch (error) {
            console.error("Failed to process cart from localStorage", error);
            // In case of error, start with an empty cart
            setCart([]);
        } finally {
            setLoading(false);
        }
    }, [user, authLoading, getCartKey, toast]);

    // Effect to save cart to localStorage whenever it changes
    useEffect(() => {
        if (!loading && !authLoading) {
            const currentCartKey = getCartKey(user);
            localStorage.setItem(currentCartKey, JSON.stringify(cart));
        }
    }, [cart, user, loading, authLoading, getCartKey]);

    const addToCart = useCallback((product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
        toast({ title: "Added to Cart", description: `${product.name} has been added to your cart.` });
    }, [toast]);

    const removeFromCart = useCallback((productId: string) => {
        const product = cart.find(p => p.id === productId);
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
        if (product) {
            toast({ title: "Removed from Cart", description: `${product.name} has been removed from your cart.` });
        }
    }, [cart, toast]);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            setCart(prevCart =>
                prevCart.map(item =>
                    item.id === productId ? { ...item, quantity } : item
                )
            );
        }
    }, [removeFromCart]);

    const clearCart = useCallback(() => {
        setCart([]);
        toast({ title: "Cart Cleared", description: "All items have been removed from your cart." });
    }, [toast]);
    
    const cartCount = useMemo(() => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }, [cart]);

    const cartTotal = useMemo(() => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    }, [cart]);


    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal, loading: loading || authLoading }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
