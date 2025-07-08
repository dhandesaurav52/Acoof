
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Product } from '@/types';
import { database, storage } from '@/lib/firebase';
import { ref, onValue, remove, update } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';

interface ProductsContextType {
    products: Product[];
    loading: boolean;
    removeProduct: (product: Product) => Promise<void>;
    updateProduct: (productId: string, data: Partial<Omit<Product, 'id'>>) => Promise<void>;
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

        setLoading(true);
        const productsRef = ref(database, 'products');

        const unsubscribe = onValue(productsRef, (snapshot) => {
            try {
                if (snapshot.exists()) {
                    const productsData = snapshot.val();
                    const productsList: Product[] = Object.keys(productsData)
                        .map(key => {
                            const product = productsData[key];
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
                                colors: product.colors || [],
                                sizes: product.sizes || [],
                            };
                        })
                        .filter((p): p is Product => p !== null)
                        .reverse(); // Reverse to show newest products first
                    setProducts(productsList);
                } else {
                    setProducts([]);
                }
            } catch(error) {
                console.error("Error processing products snapshot: ", error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        }, (error) => {
            console.error("Firebase read failed with onValue: ", error);
            setLoading(false);
        });

        // Cleanup: Unsubscribe from the listener when the component unmounts
        return () => {
            unsubscribe();
        };
    }, []);

    const removeProduct = useCallback(async (product: Product) => {
        if (!database || !storage) {
            throw new Error('Firebase not configured.');
        }

        const productRef = ref(database, `products/${product.id}`);
        await remove(productRef);
        // No need to manually update state, the onValue listener will handle it.

        const imageDeletePromises = product.images
            .filter(url => url.includes('firebasestorage.googleapis.com'))
            .map(url => {
                try {
                    const imageFileRef = storageRef(storage, url);
                    return deleteObject(imageFileRef);
                } catch (error) {
                    console.error(`Error creating ref for image ${url}. It might not be a valid storage URL.`, error);
                    return Promise.resolve();
                }
            });
        
        await Promise.all(imageDeletePromises);
    }, []);

    const updateProduct = useCallback(async (productId: string, data: Partial<Omit<Product, 'id'>>) => {
        if (!database) {
            throw new Error('Firebase not configured.');
        }
        const productRef = ref(database, `products/${productId}`);
        await update(productRef, data);
    }, []);


    return (
        <ProductsContext.Provider value={{ products, loading, removeProduct, updateProduct }}>
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
