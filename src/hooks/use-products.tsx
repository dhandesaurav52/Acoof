
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Product } from '@/types';
import { database } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';

interface ProductsContextType {
    products: Product[];
    loading: boolean;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!database) {
            console.warn("Firebase not configured, skipping product fetch.");
            setLoading(false);
            return;
        }

        const productsRef = ref(database, 'products');
        
        const listener = onValue(productsRef, (snapshot) => {
            if (snapshot.exists()) {
                const productsData = snapshot.val();
                // Firebase returns an object, so we convert it to an array
                const productsList = Object.keys(productsData).map(key => ({
                    ...productsData[key],
                    id: key,
                })).reverse(); // Show newest products first
                setProducts(productsList);
            } else {
                setProducts([]); // Handle case where there are no products
            }
            setLoading(false);
        }, (error) => {
            console.error("Firebase read failed: ", error);
            setLoading(false);
        });

        // Cleanup listener on unmount
        return () => {
            if (database) {
                off(productsRef, 'value', listener);
            }
        };
    }, []);

    return (
        <ProductsContext.Provider value={{ products, loading }}>
            {children}
        </ProductsContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductsContext);
    if (context === undefined) {
        throw new Error('useProducts must be used within a ProductsProvider');
    }
    return context;
};
