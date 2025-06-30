
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Product } from '@/types';
import { products as initialProducts } from '@/lib/data';

interface ProductsContextType {
    products: Product[];
    addProduct: (product: Omit<Product, 'id'>) => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'acoof-products';

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        // This effect runs only on the client, where localStorage is available.
        try {
            const savedProducts = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedProducts) {
                setProducts(JSON.parse(savedProducts));
            } else {
                // If no products in storage, initialize with static data and save it.
                // Show newest products first by reversing the initial list.
                const reversedInitialProducts = [...initialProducts].reverse();
                setProducts(reversedInitialProducts);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reversedInitialProducts));
            }
        } catch (error) {
            console.error("Could not initialize products from localStorage", error);
            // Fallback to static data if parsing fails.
            setProducts([...initialProducts].reverse());
        }
    }, []);

    const addProduct = useCallback((newProductData: Omit<Product, 'id'>) => {
        setProducts(prevProducts => {
            const newProduct: Product = {
                ...newProductData,
                // Create a reasonably unique ID on the client
                id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            };
            // Add the new product to the beginning of the array so it appears first
            const updatedProducts = [newProduct, ...prevProducts];
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProducts));
            return updatedProducts;
        });
    }, []);


    return (
        <ProductsContext.Provider value={{ products, addProduct }}>
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
