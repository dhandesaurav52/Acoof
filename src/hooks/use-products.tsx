
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
                const productsList: Product[] = Object.keys(productsData)
                    .map(key => {
                        const product = productsData[key];
                        // Data validation and sanitization
                        if (
                            !product ||
                            typeof product.name !== 'string' ||
                            typeof product.price !== 'number' ||
                            !Array.isArray(product.images)
                        ) {
                            console.warn(`Skipping malformed product with key: ${key}`, product);
                            return null;
                        }

                        return {
                            id: key,
                            name: product.name,
                            description: product.description || '',
                            price: product.price,
                            category: product.category || 'Tshirts',
                            images: product.images.length > 0 ? product.images : ['https://placehold.co/600x800.png'],
                            isNew: product.isNew ?? false,
                            aiHint: product.aiHint || '',
                            colors: product.colors || [],
                            sizes: product.sizes || [],
                        };
                    })
                    .filter((p): p is Product => p !== null)
                    .reverse(); // Show newest products first
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
