
'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Product } from '@/types';
import { useToast } from './use-toast';

interface WishlistContextType {
    wishlist: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const savedWishlist = localStorage.getItem('whitewolf-wishlist');
            if (savedWishlist) {
                setWishlist(JSON.parse(savedWishlist));
            }
        } catch (error) {
            console.error("Failed to parse wishlist from localStorage", error);
            localStorage.removeItem('whitewolf-wishlist');
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        if (!loading) {
            localStorage.setItem('whitewolf-wishlist', JSON.stringify(wishlist));
        }
    }, [wishlist, loading]);

    const addToWishlist = useCallback((product: Product) => {
        // Check if the item is already in the wishlist before doing anything.
        if (wishlist.some(item => item.id === product.id)) {
            return;
        }

        // If it's not there, update the state and then show the toast.
        setWishlist(prevWishlist => [...prevWishlist, product]);
        toast({ title: "Added to Wishlist", description: `${product.name} has been added to your wishlist.` });
    }, [wishlist, toast]);

    const removeFromWishlist = useCallback((productId: string) => {
        const product = wishlist.find(p => p.id === productId);
        setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== productId));
        if (product) {
            toast({ title: "Removed from Wishlist", description: `${product.name} has been removed from your wishlist.` });
        }
    }, [wishlist, toast]);

    const isInWishlist = useCallback((productId: string) => {
        return wishlist.some(item => item.id === productId);
    }, [wishlist]);

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, loading }}>
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
