
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Product } from '@/types';
import { database, storage } from '@/lib/firebase';
import { ref, get, remove } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';

interface ProductsContextType {
    products: Product[];
    loading: boolean;
    removeProduct: (product: Product) => Promise<void>;
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

        const fetchProducts = async () => {
            const productsRef = ref(database, 'products');
            try {
                const snapshot = await get(productsRef);
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
                        .reverse();
                    setProducts(productsList);
                } else {
                    setProducts([]);
                }
            } catch (error) {
                console.error("Firebase read failed: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const removeProduct = useCallback(async (product: Product) => {
        if (!database || !storage) {
            throw new Error('Firebase not configured.');
        }

        const productRef = ref(database, `products/${product.id}`);
        await remove(productRef);
        setProducts(prev => prev.filter(p => p.id !== product.id));

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

    return (
        <ProductsContext.Provider value={{ products, loading, removeProduct }}>
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
