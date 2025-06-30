
'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import type { Product, CartItem } from '@/types';
import { useToast } from './use-toast';

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const { toast } = useToast();

    const addToCart = useCallback((product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                // Increase quantity if item already exists
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            // Add new item to cart
            return [...prevCart, { ...product, quantity: 1 }];
        });
        toast({ title: "Added to Cart", description: `${product.name} has been added to your cart.` });
    }, [toast]);

    const removeFromCart = useCallback((productId: number) => {
        setCart(prevCart => {
            const product = prevCart.find(p => p.id === productId);
            if (product) {
                 toast({ title: "Removed from Cart", description: `${product.name} has been removed from your cart.` });
            }
            return prevCart.filter(item => item.id !== productId);
        });
    }, [toast]);

    const updateQuantity = useCallback((productId: number, quantity: number) => {
        setCart(prevCart => {
            if (quantity <= 0) {
                // Remove item if quantity is 0 or less
                const product = prevCart.find(p => p.id === productId);
                if (product) {
                    toast({ title: "Removed from Cart", description: `${product.name} has been removed from your cart.` });
                }
                return prevCart.filter(item => item.id !== productId);
            }
            return prevCart.map(item =>
                item.id === productId ? { ...item, quantity } : item
            );
        });
    }, [toast]);

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
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
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
