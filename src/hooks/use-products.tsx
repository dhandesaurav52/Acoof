
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Product } from '@/types';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

interface ProductsContextType {
    products: Product[];
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        if (!database) {
            console.warn("Firebase Database is not configured, products will not be loaded.");
            return;
        }

        const productsRef = ref(database, 'products');
        const unsubscribe = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const productsList = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key
                }));
                // Show newest products first
                setProducts(productsList.reverse());
            } else {
                setProducts([]);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);


    return (
        <ProductsContext.Provider value={{ products }}>
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
