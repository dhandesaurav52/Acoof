
'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Product } from '@/types';
import { useToast } from './use-toast';

interface WishlistContextType {
    wishlist: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: number) => void;
    isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const { toast } = useToast();

    const addToWishlist = useCallback((product: Product) => {
        if (!wishlist.some(item => item.id === product.id)) {
            setWishlist(prevWishlist => [...prevWishlist, product]);
            toast({ title: "Added to Wishlist", description: `${product.name} has been added to your wishlist.` });
        }
    }, [wishlist, toast]);

    const removeFromWishlist = useCallback((productId: number) => {
        const product = wishlist.find(p => p.id === productId);
        if (product) {
            setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== productId));
            toast({ title: "Removed from Wishlist", description: `${product.name} has been removed from your wishlist.` });
        }
    }, [wishlist, toast]);

    const isInWishlist = useCallback((productId: number) => {
        return wishlist.some(item => item.id === productId);
    }, [wishlist]);

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
