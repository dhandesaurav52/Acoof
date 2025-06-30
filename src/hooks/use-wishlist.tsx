
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
            const savedWishlist = localStorage.getItem('acoof-wishlist');
            if (savedWishlist) {
                setWishlist(JSON.parse(savedWishlist));
            }
        } catch (error) {
            console.error("Failed to parse wishlist from localStorage", error);
            localStorage.removeItem('acoof-wishlist');
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        if (!loading) {
            localStorage.setItem('acoof-wishlist', JSON.stringify(wishlist));
        }
    }, [wishlist, loading]);

    const addToWishlist = useCallback((product: Product) => {
        setWishlist(prevWishlist => {
            if (!prevWishlist.some(item => item.id === product.id)) {
                toast({ title: "Added to Wishlist", description: `${product.name} has been added to your wishlist.` });
                return [...prevWishlist, product];
            }
            return prevWishlist;
        });
    }, [toast]);

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
